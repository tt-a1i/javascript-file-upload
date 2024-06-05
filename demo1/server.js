/*
http：用于创建HTTP服务器的模块；
url：用于解析URL地址的模块；
path：用于处理文件路径的模块；
fs：用于进行文件操作的模块。
 */
var http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");

//通过process.argv[2]获取命令行传递的第二个参数，如果不存在则默认使用80作为端口号。
var port = process.argv[2] || 80;

// 引入require的HTTP请求对象req和响应对象res
function formidable(req, res) {
  // parse a file upload
  var expect = 'sp';// 初始化状态为'sp'（即期待读取分隔符）
  var begin = new Date();// 记录处理开始的时间
  var sp, cont, type, total = 0;// 定义分隔符，内容头，内容类型，总数据量变量

  // 监听数据事件，每当请求对象接收到数据块（tr）时触发
  req.on('data', function (tr) {
    while (1) {// 使用无限循环处理每一个数据块
      switch (expect) {// 根据当前的期待状态进行不同的处理
        case 'sp':
          var idx = tr.indexOf('\r\n');// 查找\r<br />（新行标志）的位置
          if (idx == -1) return; // 如果未找到，返回等待下个数据块
          sp = tr.slice(0, idx).toString();// 获取分隔符
          tr = tr.slice(idx + 2);// 更新数据块，去掉已处理的部分
          console.log('sp:', sp);// 在控制台打印分隔符
          expect = 'content';// 更新期待状态为'content'
          break;
        case 'content':
          var idx = tr.indexOf('\r\n');
          cont = tr.slice(0, idx).toString();// 获取内容描述头部信息
          console.log('content:', cont);
          if (/Content-Disposition: ?form-data;.*filename="/.test(cont)) {
            expect = 'type';// 如果内容包含文件名，更新期待状态为'type'
            tr = tr.slice(idx + 2);
          } else {
            expect = 'value';// 如果内容不包含文件名，表明是普通值，更新为'value'
            tr = tr.slice(idx + 4);
          }
          break;
        case 'value':
          var idx = tr.indexOf('\r\n');
          value = tr.slice(0, idx).toString();// 获取实际的表单值
          tr = tr.slice(idx + 2);
          console.log('value:', value);
          expect = 'sp';// 处理完毕后，期待重新读取分隔符
          break;
        case 'type':
          var idx = tr.indexOf('\r\n');
          type = tr.slice(0, idx).toString(); // 获取文件内容类型
          tr = tr.slice(idx + 4);
          console.log('type:', type);
          expect = 'end'; // 更新期待状态为'end'，即读取文件内容
          break;
        case 'end':
          var idx = tr.indexOf('\r\n' + sp);
          process.stdout.write('.');// 控制台打印点，表示处理过程
          if (idx >= 0) {
            total += idx;// 累加处理的数据长度
          } else total += tr.length;
          return; // 数据块处理完成，等待下一块
      }
    }
  }).on('end', function () {// 监听数据结束事件
    console.log('\ntotal:', total);
    var spendTm = new Date() - begin; // 计算处理耗时
    // 发送响应头和正文，包括内容、数据处理总量、上传速度等信息
    res.end(`<head>
            <meta http-equiv="Content-Type" content="text/html; charset=gb2312" />
            </head>
            <body><p>${cont}</p>
            <p>total: ${total}</p>
            <p>upload speed: ${parseInt((total * 8) / (spendTm / 1000))} bps</p>
            <p>upload speed: ${parseInt((total / 1024 / 1024) / (spendTm / 1000))} Mbyte per second</p>
            </body>`);
  });
}

/*
* 定义了一个名为mimeTypes的对象，其中键值对表示了不同文件类型对应的MIME类型。
* 这个对象可以在其他地方被引用，以便在处理不同文件类型时，获取其对应的MIME类型
*/
var mimeTypes = {
  "htm": "text/html",
  "html": "text/html",
  "jpeg": "image/jpeg",
  "jpg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "js": "text/javascript",
  "css": "text/css"
};

// 创建一个空对象用于存储虚拟目录的映射
var virtualDirectories = {
  //"images": "../images/"
};

// 将当前工作目录更改为当前文件所在的目录
process.chdir(__dirname);

// 创建一个HTTP服务器
http.createServer(function (req, res) {
  // 处理上传请求，如果请求的URL是'/upload'并且方法是POST
  if (req.url == '/upload' && req.method.toLowerCase() == 'post') {
    console.log('post', req.url);
    formidable(req, res);// 调用formidable函数处理表单数据
    return;
  }

  // 如果访问的URL是'/big'，用于下载大文件
  if (req.url == '/big') {
    // 设置响应头
    res.setHeader('Content-Length', "4423129088");
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=CentOS-6.2.ios`);
    // 创建一个文件流并直接发送到响应的内容
    fs.createReadStream('/Users/zhi.liang/Downloads/CentOS-6.2-x86_64-bin-DVD1.iso').pipe(res);
    return;
  }

  // 如果访问的URL是'/small'，用于下载小文件
  if (req.url == '/small') {
    res.setHeader('Content-Length', "6393");
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=etc.passwd.txt`);
    fs.createReadStream('/etc/passwd').pipe(res);
    return;
  }

  // 解析请求的URL获取路径名
  var uri = url.parse(req.url).pathname
      , filename = path.join(process.cwd(), uri)// 将当前工作目录和路径名合并为完整的文件路径
      , root = uri.split("/")[1]// 获取第一个路径段（可能是虚拟目录）
      , virtualDirectory;

  // 检查第一个路径段是否是虚拟目录
  virtualDirectory = virtualDirectories[root];
  if (virtualDirectory) {
    // 更新uri和filename去掉虚拟目录部分
    uri = uri.slice(root.length + 1, uri.length);
    filename = path.join(virtualDirectory, uri);
  }

  // 检查文件是否存在
  fs.exists(filename, function (exists) {
    if (!exists) {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      console.error('404: ' + filename);
      return;
    }

    // 如果是一个目录，则尝试访问目录下的index.html文件
    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    // 读取文件内容，并以二进制形式返回
    fs.readFile(filename, "binary", function (err, file) {
      if (err) {
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        console.error('500: ' + filename);
        return;
      }

      // 根据文件扩展名获取对应的MIME类型
      var mimeType = mimeTypes[path.extname(filename).split(".")[1]];
      // 设置正确的MIME类型并发送文件内容
      res.writeHead(200, {"Content-Type": mimeType});
      res.write(file, "binary");
      res.end();
      console.log('200: ' + filename + ' as ' + mimeType);
    });
  });
}).listen(parseInt(port, 10)); // 监听端口，端口号是变量port的值

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");
