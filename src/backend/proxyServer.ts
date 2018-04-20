// @ts-check
'use strict';

const http = require('http');
const request = require('request');
const express = require('express');
const Agent = require('socks5-http-client/lib/Agent');
const fs = require('fs');
const zlib = require('zlib');
const parseAL = require('./AL.js');
const TranslateFileList = {
    'StatusText.atb': 'StatusText.txt',
    'MainFont.aft': 'MainFont.aft',
    'AbilityList.atb': 'AbilityList.txt',
    'AbilityText.atb': 'AbilityText.txt',
    'NameText.atb': 'NameText.txt',
    'PlayerTitle.atb': 'PlayerTitle.txt',
    'SkillList.atb': 'SkillList.txt',
    'SkillText.atb': 'SkillText.txt',
    'SystemText.atb': 'SystemText.txt',
    'PlayerUnitTable.aar': 'PlayerUnitTable',
    'BattleTalkEvent800001.aar': 'BattleTalkEvent800001'
};

function parse(buffer) {
    const result = parseAL(buffer, 0);
    return result;
}


function mkdir(dirArray, max) {
    if (max === undefined) {
        max = dirArray.length;
    }
    let nowDir = '.';
    for (let i = 0; i < max; i++) {
        nowDir += '/' + dirArray[i];
        if (!fs.existsSync(nowDir)) {
            fs.mkdirSync(nowDir);
        }
    }
}

export class ProxyServer {
    FileList = {};
    ProxyHost = '127.0.0.1'
    ProxyPort = 1080;
    ProxyEnable = false;
    ProxyIsSocks5 = false;
    createServer() {
        const app = express();
        app.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            next();
        })
        app.use(function (req, res) {
            const headers = req.headers;
            headers.host = 'assets.millennium-war.net';
            // 设置代理
            const options: any = {
                url: 'http://assets.millennium-war.net' + req.path,
                headers: headers,
                encoding: null,
            };
            if (this.ProxyEnable === true && this.ProxyIsSocks5 === true) {
                options.agentClass = Agent;
                options.agentOptions = {
                    socksHost: this.ProxyHost,
                    socksPort: this.ProxyPort
                }
            }
            if (this.ProxyEnable === true && this.ProxyIsSocks5 === false) {
                options.proxy = `http://${this.ProxyHost}:${this.ProxyPort}`
            }
            let requestFileName = this.FileList[req.path];
            if (req.path.indexOf('18cbbe1a57873ab0047629f77cbbcf86') !== -1) {
                requestFileName = 'MainFont.aft';
            }
            const modifyFileName = TranslateFileList[requestFileName]
            // 文件热封装
            const modifyFilePath = 'mod/' + modifyFileName;
            if (fs.existsSync(modifyFilePath)) {
                console.log(requestFileName, 'modify by Server');
                // Font文件直接回传
                if (requestFileName === 'MainFont.aft') {
                    res.send(fs.readFileSync(modifyFilePath))
                    return;
                }
                /*
                // 其他文件
                let result;
                options.gzip = true;
                request(options, (err, response, body) => {
                    result = parse(body);
                    // 这边也需要添加一个任务队列，不然会爆炸
                    // res.send(result.Package(translateFilePath));
                    // res.send(body);
                })
                */
            } else {
                request(options, (err, res, body) => {
                    if (body === undefined) {
                        console.log('Error on ' + req.path);
                    }
                }).pipe(res);
            }
        });
        const server = http.createServer(app);
        server.on('error', (e) => {
            console.log(e);
        });
        server.listen('19980', function () {
            console.log('listen at 19980');
        });
    }
    setFileList(fileList) {
        this.FileList = fileList;
    }
    setProxy(enable, isSocks5, host, port) {
        this.ProxyEnable = enable;
        this.ProxyIsSocks5 = isSocks5;
        if (enable) {
            this.ProxyHost = host;
            this.ProxyPort = port;
        }
    }
}

