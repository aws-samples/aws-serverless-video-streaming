// SPDX-FileCopyrightText: 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
//
// SPDX-License-Identifier: MIT-0 License

import React from 'react'
import ReactPlayer from 'react-player'
import './player.css'

class Player extends React.Component {
    render() {
        return (
            <div className='player-wrapper'>
                <ReactPlayer
                    url={this.props.url}
                    playsinline
                    pip
                    playing
                    controls
                    config={{
                        file: {
                            enableWorker: true,
                            enableStashBuffer: false,
                            stashInitialSize: 128,
                        },
                      }}
                />
            </div>
        )
    }
}
export default Player;
