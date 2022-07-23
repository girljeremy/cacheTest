/*
 * @Author: liuweihang
 * @Date: 2022-07-23 15:45:00
 * @LastEditTime: 2022-07-23 17:43:10
 * @LastEditors: liuweihang
 * @Description: http缓存 node.js服务
 * @FilePath: /myVueViteApp/Users/liuweihang/Desktop/Learn/node/catchTest/index.js
 */
// 强缓存
// 媒体类型
const mimes = {
  css: "text/css",
  less: "text/css",
  gif: "image/gif",
  html: "text/html",
  ico: "image/x-icon",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  pdf: "application/pdf",
  png: "image/png",
  svg: "image/svg+xml",
  swf: "application/x-shockwave-flash",
  tiff: "image/tiff",
  txt: "text/plain",
  wav: "audio/x-wav",
  wma: "audio/x-ms-wma",
  wmv: "video/x-ms-wmv",
  xml: "text/xml",
}
const koa = require("koa") // 封装了的异步请求方式
const url = require("url") // 引入url模块解析url字符串
const fs = require("fs") // 对系统文件及目录进行读写操作。
const crypto = require("crypto") //提供加密功能
const path = require("path") // 获取路径
const hosthame = "localhost"
const port = 8001
// 处理content-type的响应类型
function parseMime(url) {
  // path.extname获取路径文件后缀名
  let extName = path.extname(url)
  extName = extName ? extName.slice(1) : "unknown"
  return mimes[extName]
}

// 将文件转成传输所需格式
const parseStatic = (dir) => {
  return new Promise((resolve) => {
    resolve(fs.readFileSync(dir), "binary") // 读取文件并返回其内容。
  })
}
// 协商缓存 用于获取文件信息
const getFilesStat = (path) => {
  return new Promise((resolve) => {
    fs.stat(path, (_, stat) => {
      resolve(stat)
    })
  })
}
const server = new koa() // 创建服务
server.use(async (ctx) => {
  const url = ctx.request.url
  if (url === "/") {
    //根目录下返回index.html
    ctx.set("content-type", "text/html")
    ctx.body = await parseStatic("./index.html")
  } else {
    const type = await parseMime(url)
    const filePath = path.resolve(__dirname, `.${url}`)
    ctx.set("content-type", `${type}`)
    // 强缓存 expires 时效为30000ms
    // const time = new Date(Date.now() + 30000).toUTCString()
    // ctx.set("expires", time)
    // 强缓存 cache-control 时效为30s
    // ctx.set("cache-control", "max-age=30")
    // 协商缓存 对比文件最后一次修改时间  Last-Modified，If-Modified-Since
    // const fileStat = await getFilesStat(filePath)
    // const ifModifiedSince = ctx.request.header["if-modified-since"]
    // ctx.set("cache-control", "no-cache")
    // console.log(new Date(fileStat.mtime).getTime(), fileStat, fileStat.mtime)
    // // mtime为文件最后修改时间
    // if (ifModifiedSince === fileStat.mtime.toGMTString()) {
    //   ctx.status = 304
    // } else {
    //   ctx.set("last-modified", fileStat.mtime.toGMTString())
    //   ctx.body = await parseStatic(filePath)
    // }
    // 协商缓存 对比资源内容 Etag，If-None-Match 读取资源内容-->转成hash值-->对比
    const fileBuffer = await parseStatic(filePath)
    const ifNoneMatch = ctx.request.header["if-none-match"]
    const hash = crypto.createHash("md5")
    hash.update(fileBuffer)
    const etag = `"${hash.digest("hex")}"`
    ctx.set("cache-control", "no-cache")
    // 对比hash值
    if (ifNoneMatch === etag) {
      ctx.status = 304
    } else {
      ctx.set("etag", etag)
      ctx.body = fileBuffer
    }
  }
})
server.listen(port, () => {
  console.log(`Server running at http://${hosthame}:${port}/`)
})
