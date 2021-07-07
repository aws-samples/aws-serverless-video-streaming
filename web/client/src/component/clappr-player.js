// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React from 'react';
import Clappr from 'clappr';
import LevelSelector from 'level-selector'
import DashShakaPlayback from 'dash-shaka-playback'


class ClapprWrapper extends React.Component {
  constructor(props) {
    super(props)
    this.playerInstance = new Clappr.Player({ 
      mute: false, //静音为true
      poster:'', //设置封面图
      autoPlay: true,
      disableCanAutoPlay: true, //禁用检测浏览器是否可以自动播放视频
      hideMediaControl: true, //禁用媒体控制自动隐藏
      hideMediaControlDelay: 100, //更改默认的媒体控件自动隐藏超时值
      hideVolumeBar: false, //当嵌入的宽度小于320时，音量条将被隐藏
      mediacontrol: {seekbar: "#000", buttons: "#FFF"}, //定义进度条和底部暂停等图标的颜色
   //   watermark: "https://ss1.bdstatic.com/70cFvXSh_Q1YnxGkpoWK1HF6hhy/it/u=38993578,726419589&fm=26&gp=0.jpg",
      position: 'top-right',
       plugins: {
        core: [LevelSelector],
        playback:[DashShakaPlayback]
      },
      
      levelSelectorConfig: {
        title: '動画品質',
      },      
      // chromeless:true,
    })
    this.nodeRef = React.createRef()
  }
  
  componentDidMount() {
    this.playerInstance.attachTo(this.nodeRef.current)
    this.loadSource(this.props.src)
  }
  
  componentWillUnmount() {
    this.playerInstance.destroy()
  }
  
  shouldComponentUpdate(nextProps, _) {
    if (nextProps.src !== this.props.src) {
      this.loadSource(nextProps.src)
    }
    return false
  }
  
  loadSource(src) {
    this.playerInstance.load(src)
  }
  
  render() {
    return <div ref={this.nodeRef} />
  }
}

export default ClapprWrapper;