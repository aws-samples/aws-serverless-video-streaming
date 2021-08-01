# Auditing and logging
Collecting and analyzing \[audit\] logs is useful for a variety of different reasons.  Logs can help with root cause analysis and attribution, i.e. ascribing a change to a particular user. When enough logs have been collected, they can be used to detect anomalous behaviors too. On EKS, the audit logs are sent to Amazon Cloudwatch Logs. The audit policy for EKS currently augments the reference [policy](https://github.com/kubernetes/kubernetes/blob/master/cluster/gce/gci/configure-helper.sh#L983-L1108) in the helper script with the following policy: 

```yaml
- level: RequestResponse
    namespaces: ["kube-system"]
    verbs: ["update", "patch", "delete"]
    resources:
      - group: "" # core
        resources: ["configmaps"]
        resourceNames: ["aws-auth"]
    omitStages:
      - "RequestReceived"
```
This logs changes to the `aws-auth` ConfigMap which is used to grant access to an EKS cluster. 

## Recommendations

### Enable audit logs
The audit logs are part of the EKS managed Kubernetes control plane logs that are managed by EKS.  Instructions for enabling/disabling the control plane logs, which includes the logs for the Kubernetes API server, the controller manager, and the scheduler, along with the audit log, can be found here, [https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html#enabling-control-plane-log-export](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html#enabling-control-plane-log-export). 

!!! info
    When you enable control plane logging, you will incur [costs](https://aws.amazon.com/cloudwatch/pricing/) for storing the logs in CloudWatch. This raises a broader issue about the ongoing cost of security. Ultimately you will have to weigh those costs against the cost of a security breach, e.g. financial loss, damage to your reputation, etc. You may find that you can adequately secure your environment by implementing only some of the recommendations in this guide. 

!!! warning
    The maximum size for a CWL entry is 256KB whereas the maximum Kubernetes API request size is 1.5MiB. This is important know because an attacker could theoretically obfuscate their activity by creating a request that is too large for CWL to handle. This can be done by padding the annotations field of a request with a large amount of junk data, which hides all data after the annotation.

### Utilize audit metadata
Kubernetes audit logs include two annotations that indicate whether or not a request was authorized `authorization.k8s.io/decision` and the reason for the decision `authorization.k8s.io/reason`.  Use these attributes to ascertain why a particular API call was allowed. 
   
### Create alarms for suspicious events
Create an alarm to automatically alert you where there is an increase in 403 Forbidden and 401 Unauthorized responses, and then use attributes like `host`, `sourceIPs`, and `k8s_user.username` to find out where those requests are coming from.
  
### Analyze logs with Log Insights
Use CloudWatch Log Insights to monitor changes to RBAC objects, e.g. Roles, RoleBindings, ClusterRoles, and ClusterRoleBindings.  A few sample queries appear below: 

Lists updates to the `aws-auth` ConfigMap:
```
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter verb in ["update", "patch"]
| filter objectRef.resource = "configmaps" and objectRef.name = "aws-auth" and objectRef.namespace = "kube-system"
| sort @timestamp desc
```
Lists creation of new or changes to validation webhooks:
```
fields @timestamp, @message
| filter @logStream like "kube-apiserver-audit"
| filter verb in ["create", "update", "patch"] and responseStatus.code = 201
| filter objectRef.resource = "validatingwebhookconfigurations"
| sort @timestamp desc
```
Lists create, update, delete operations to Roles:
```
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="roles" and verb in ["create", "update", "patch", "delete"]
```
Lists create, update, delete operations to RoleBindings:
```
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="rolebindings" and verb in ["create", "update", "patch", "delete"]
```
Lists create, update, delete operations to ClusterRoles:
```
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="clusterroles" and verb in ["create", "update", "patch", "delete"]
```
Lists create, update, delete operations to ClusterRoleBindings:
```
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="clusterrolebindings" and verb in ["create", "update", "patch", "delete"]
```
Plots unauthorized read operations against Secrets:
```
fields @timestamp, @message
| sort @timestamp desc
| limit 100
| filter objectRef.resource="secrets" and verb in ["get", "watch", "list"] and responseStatus.code="401"
| count() by bin(1m)
```
List of failed anonymous requests:
```
fields @timestamp, @message, sourceIPs.0
| sort @timestamp desc
| limit 100
| filter user.username="system:anonymous" and responseStatus.code in ["401", "403"]
```

### Audit your CloudTrail logs
AWS APIs called by pods that are utilizing IAM Roles for Service Accounts (IRSA) are automatically logged to CloudTrail along with the name of the service account. If the name of a service account that wasn't explicitly authorized to call an API appears in the log, it may be an indication that the IAM role's trust policy was misconfigured. Generally speaking, Cloudtrail is a great way to ascribe AWS API calls to specific IAM principals. 

### Use CloudTrail Insights to unearth suspicious activity
CloudTrail insights automaticatlly analyzes write management events from CloudTrail trails and alerts you of unusual activity. This can help you identify when there's an increase in call volume on write APIs in your AWS account, including from pods that use IRSA to assume an IAM role. See [Announcing CloudTrail Insights: Identify and Response to Unusual API Activity](https://aws.amazon.com/blogs/aws/announcing-cloudtrail-insights-identify-and-respond-to-unusual-api-activity/) for further information.

### Additional resources
As the volume of logs increases, parsing and filtering them with Log Insights or another log analysis tool may become ineffective.  As an alternative, you might want to consider running [Sysdig Falco](https://github.com/falcosecurity/falco) and [ekscloudwatch](https://github.com/sysdiglabs/ekscloudwatch). Falco analyzes audit logs and flags anomalies or abuse over an extended period of time. The ekscloudwatch project forwards audit log events from CloudWatch to Falco for analysis. Falco provides a set of [default audit rules](https://github.com/falcosecurity/falco/blob/master/rules/k8s_audit_rules.yaml) along with the ability to add your own. 

Yet another option might be to store the audit logs in S3 and use the SageMaker [Random Cut Forest](https://docs.aws.amazon.com/sagemaker/latest/dg/randomcutforest.html) algorithm to anomalous behaviors that warrant further investigation.

## Tooling
The following commercial and open source projects can be used to assess your cluster's alignment with established best practices:

+ [kubeaudit](https://github.com/Shopify/kubeaudit)
+ [MKIT](https://github.com/darkbitio/mkit)
+ [kube-scan](https://github.com/octarinesec/kube-scan) Assigns a risk score to the workloads running in your cluster in accordance with the Kubernetes Common Configuration Scoring System framework
+ [amicontained](https://github.com/genuinetools/amicontained) Reveals which Capabilities are allowed and syscalls that are blocked by the container runtime
+ [kubesec.io](https://kubesec.io/)
+ [polaris](https://github.com/FairwindsOps/polaris)
+ [Starboard](https://github.com/aquasecurity/starboard)
+ [kAudit](https://www.alcide.io/kaudit-K8s-forensics/)
+ [Snyk](https://support.snyk.io/hc/en-us/articles/360003916138-Kubernetes-integration-overview)
