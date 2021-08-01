# AWS 中国区部署手册

[English](./AWS_CN_EN.md)

## 前提条件

在启动解决方案的AWS CloudFormation模板之前，您必须在SourceBuckets模板参数中指定一个Amazon Simple Storage Service（Amazon S3）存储桶。 使用此存储桶存储要处理的图像。 请注意，如果您有多个图像源存储桶，则可以将它们指定为逗号分隔的值。 请在启动AWS CloudFormation模板的**同一AWS区域**中使用S3存储桶。

CloudFront 需要配置 ICP 备案的域名，在生产环境中，我们建议您同时为 CloudFront 配置 SSL 证书来开启 HTTPS. 在部署本方案前，请先完成上传 SSL 证书到 AWS Identity and Access Management（IAM)。

我们建议您在首次部署解决方案以测试解决方案的功能时，部署可选的演示用户界面。

## 本章节涵盖内容

在AWS上部署此架构的过程包括以下步骤。 有关详细说明，请遵循每个步骤的链接。

[步骤 1. 启动 CloudFormation 堆栈](#%e6%ad%a5%e9%aa%a4-1-%e5%90%af%e5%8a%a8-cloudformation-%e5%a0%86%e6%a0%88)

* 将AWS CloudFormation模板启动到您的AWS账户中。
* 输入所需参数的值：CorsEnabled，CorsOrigins，SourceBuckets，DeployDemoUI，LogRetentionPeriod
* 查看其他模板参数，并在必要时进行调整。

[步骤 2. 配置 CloudFront CNAME 和 SSL 证书](#%e6%ad%a5%e9%aa%a4-2-%e9%85%8d%e7%bd%ae-cloudfront-cname-%e5%92%8c-ssl-%e8%af%81%e4%b9%a6)

* 为 Image Handler Distribution 配置 CNAME 和 SSL 证书
* 为 Demo UI Distribution 配置 CNAME

[步骤 3. 创建和使用图像请求](#%e6%ad%a5%e9%aa%a4-3-%e5%88%9b%e5%bb%ba%e5%92%8c%e4%bd%bf%e7%94%a8%e5%9b%be%e5%83%8f%e8%af%b7%e6%b1%82)

* 在前端设置图像请求。
* 将图像请求发送到您的API。


## 步骤 1. 启动 CloudFormation 堆栈

此自动化AWS CloudFormation模板在AWS Cloud上部署无服务器图像处理程序。

您负责运行此解决方案时使用的AWS服务的成本。 有关更多详细信息，请参见“费用”部分。 有关完整详细信息，请参阅此解决方案中将使用的每个AWS服务的定价页面。

1. 登录到AWS管理控制台，然后单击下面的按钮以启动无服务器图像处理程序AWS CloudFormation模板。

    [![Launch Stack](launch-stack.svg)](https://cn-northwest-1.console.amazonaws.cn/cloudformation/home?region=cn-northwest-1#/stacks/create/template?stackName=ServerlessImageHandler&templateURL=https:%2F%2Faws-solutions-reference.s3.cn-north-1.amazonaws.com.cn%2Fserverless-image-handler%2Flatest%2Fserverless-image-handler.template)
1. 默认情况下，该模板在 AWS 宁夏区域启动。 要在其他AWS区域中启动无服务器图像处理程序，请使用控制台导航栏中的区域选择器。

1. 在**创建堆栈**页面上，确认 **Amazon S3 URL** 文本框中显示正确的模板URL，然后选择**下一步**。

1. 在**指定堆栈详细信息**页面上，为解决方案堆栈分配名称。

1. 在**参数**下，查看模板的参数并根据需要进行修改。 此解决方案使用以下默认值。如果您希望部署 Demo UI, 请为 CorsEnabled 和 DeployDemoUI 参数选择 **Yes**。
    | 参数               | 默认       | 描述                                                                                                                                                                                                         |   |   |
    |--------------------|------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---|---|
    | CorsEnabled        | No         | 选择是否启用跨域资源共享（CORS）。如果您希望部署 Demo UI, 请选择 Yes。                                                                                                                                       |   |   |
    | CorsOrigin         | *          | 该值将由API在Access-Control-Allow-Origin标头中返回。 星号（*）可以支持任何原点。 我们建议您指定一个特定来源（例如`http://example.domain`),以限制跨站点访问您的API。如果CorsEnabled参数设置为No，则忽略此值。 |   |   |
    | SourceBuckets      | *需要输入* | 您帐户中的一个或多个S3存储桶，其中包含您将要操作的图像。 如果提供多个存储桶，请用逗号分隔。请确保选择的S3存储桶和这个解决方案位于同一个AWS区域。                                                             |   |   |
    | DeployDemoUI       | Yes        | 将部署到Demo S3存储桶的 Demo UI。了解更新信息，请访问[Appendix B](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/appendix-b.html)。                                                                                                                                            |   |   |
    | LogRetentionPeriod | 1          | 将Lambda日志数据保留在CloudWatch日志中的天数。                                                                                                                                                               |   |   |

1. 选择**下一步**。
   
1. 在**配置堆栈选项**页面上，选择“下一步”。

1. 在**审核**页面上，查看并确认设置。 确保选中确认模板将创建 AWS Identity and Access Management（IAM）资源的框。

1. 选择**创建堆栈**以部署堆栈。

您可以在AWS CloudFormation控制台的**状态**列中查看堆栈的状态。 您应该在大约30分钟内看到状态为CREATE_COMPLETE。

## 步骤 2. 配置 CloudFront CNAME 和 SSL 证书

1. 点击注释为 **Image handler distribution** 的 CloudFront 分配。

1. 选择**常规**选项卡下的**编辑**按钮。

1. 在**备用域名(CNAMEs)**下，输入 ICP 备案过的域名。

1. 在**SSL 证书**处，选中**自定义 SSL 证书**，并且选择您之前上传到 IAM 的 SSL 证书。

1. 选择**是，请修改**按钮。

如果您选择同时部署 Demo UI, 则也需要配置 ICP 备案过的域名，**可不配置 SSL 证书**。

1. 点击注释为 **Website distribution for solution** 的 CloudFront 分配。

1. 选择**常规**选项卡下的**编辑**按钮。

1. 在**备用域名(CNAMEs)**下，输入 ICP 备案过的域名。

1. 选择**是，请修改**按钮。

在为 CloudFront 配置完 CNAME 之后，在您的 DNS 解析服务器配置 CNAME 记录，并指向 CloudFront 分配的默认域名。

如果您选择部署 Demo UI, 则他的访问地址为 `https://demo-website-domain/index.html`。您可以先使用 Demo UI 来测试该方案。

## 步骤 3. 创建和使用图像请求

该解决方案生成一个CloudFront域名，该域名使您可以通过图像处理程序API访问原始图像和修改后的图像。您为 Image Handler Distribution 配置的CNAME即为该方案的域名，我们称之为 **ApiEndpoint**。 图像的位置和要进行的编辑等参数是在前端的JSON对象中指定的。

例如，以下代码块将图像位置指定为myImageBucket，并指定灰度编辑：true可以将图像更改为灰度。

```javascript
const imageRequest = JSON.stringify({
    bucket: “myImageBucket”
    key: “myImage.jpg”,
    edits: {
        grayscale: true
    }
});
const url = `${CloudFrontUrl}/${btoa(imageRequest)}`;

// Alternatively, you can call the url directly in an <img> element, similar to:
<img src=`${url}` />
```

1. 在代码沙箱或您的前端应用程序中，创建一个新的JSON对象。该对象将包含成功检索图像并对其进行编辑所需的键值对。

2. 使用上面的代码示例和Sharp文档，调整以下属性以满足您的图像编辑要求。
    * **Bucket** - 指定包含原始图像文件的Amazon S3存储桶。这是**SourceBuckets**模板参数中指定的名称。您可以通过将图像位置添加到图像处理程序AWS Lambda函数的SOURCE_BUCKETS环境变量中来更新图像位置。
    * **Key** - 指定原始图像的文件名。该名称应包括文件扩展名以及其位置与存储桶根之间的所有子文件夹。例如，folder1 / folder2 / image.jpg。
    * **Edits** - 将任何图像编辑指定为键值对。如果未指定图像编辑，则将返回原始图像，并且不做任何更改。

3. 对图像请求进行字符串化和编码。您可以使用JavaScript的JSON.stringify()属性，然后使用btoa()属性对结果进行编码。

4. 将编码结果附加到您的ApiEndpoint URL上，并将其用作HTML **img src**属性的值或GET请求中的值。请参见以下示例。
    ```javascript
    const imageRequest = JSON.stringify({
        bucket: “myImageBucket”
        key: “myImage.jpg”,
        edits: {
            grayscale: true
    }
    });
    const url = `${CloudFrontUrl}/${btoa(imageRequest)}`;

    // Alternatively, you can call the url directly in an <img> element, similar to:
    <img src=`${url}` />
    ```

5. 以下是前面代码中产生编码图像请求的示例：`https://<ApiEndpoint>/<base64encodedRequest>`。

