# JavaScript文件上传详解

~~~sh
git clone https://github.com/ktont/javascript-file-upload
node javascript-file-upload/demo6/server.js
~~~

## 目录

> [demo1 form 表单，原生的文件上传方式](#demo1)   
> [demo2 plupload 的原理](#demo2)  
> [demo3 mOxie 文件选取和文件预览](#demo3)   
> [demo4 mOxie 文件上传，进度提示](#demo4)   
> [demo5 使用 plupload 实现了图片上传](#demo5)   
> [demo6 断点续传](#demo6)   
> [demo7 plupload 之 Ui Widget 的示例](#demo7)   
> [demo8 服务端限速](#demo8)   
> [demo9 FAQ 批量上传的时候，如何为每个文件添加一个id](#demo9)     
> [总结](#end)   

本教程包含7个 demo，它们循序渐进、由浅入深地讲解**文件上传**。每个 demo 都被精心设计，都是可执行的。
因为我刚做完并上线了一个真实的**文件上传**程序，所以有些 demo 对实际生产有指导意义。

除了前端的**上传**部分。后端的**接收**部分也由我们一手操办，并且没有用现成的包而是亲自去解析数据，因为我想让你更清晰的看到 **http 协议**。

在运行 demo 的时候，请将网络速度调低，这样，我们就可以清楚的看到 **http 的交互过程**。
调低网络速度的方法之一，是用 chrome 的 debugger 工具，下文会有详细的图示。

~~~bash
windows
下载zip文件，然后解压到c盘
c:\> cd javascript-file-upload-master
c:\> node demo1\server.js

linux or mac
$ git clone https://github.com/ktont/javascript-file-upload
$ cd javascript-file-upload
$ sudo node demo1/server.js
类推，运行demo2的时候，去执行demo2下的server.js。
$ sudo node demo2/server.js
~~~

然后在浏览器中(建议 chrome)打开 [http://localhost](http://localhost)

__ERROR__: 如果你遇到 EADDRINUSE 的错误，那是因为80端口已经被其它诸如 apache、nginx 的进程占用了。
可以在启动的时候指定端口, 比如端口3000。

$ node demo1/server.js 3000

__ERROR__: 如果遇到 EACCES 的错误，请用 sudo 权限运行它。

$ sudo node demo1/server.js

## <a name="demo1"></a>1、form表单，原生文件上传方式

首先，来看第一个例子。
它是用原生的文件提交方法，前端只有一段 html 而没有 js。我们的目的是**观察** http 协议。

前端 index.html，使用一个 input 标签进行文件选择，然后使用 form 表单发送数据。
后端 server.js，对表单发过来的数据进行解析，把协议格式打印出来。

点击 选择文件 后

<img src="img/1.1.png" width="500">

在点击 Upload 按钮之前，对网络进行限速，方便观察数据传输的过程。打开 debugger

<img src="img/1.2.png" width="500">

点击后，选取一个较慢的

<img src="img/1.22.png" width="200">

服务端会打印下面的提示，注意红框中的 token，它用来表示二进制数据的边界。
<img src="img/1.3.png" width="400">

你在 server.js 中可以看到解析 http 数据的 formidable 函数。
可以调试它，用来学习 http 协议。

上传完成后

<img src="img/1.4.png" width="450" style="border: 1px solid red"／>

__TIP__: 观察，它是我们本次学习之旅的主要方法。
你一定要运行每个例子，看到它们运行，观察它们的行为。
这样，就熟悉了这个技术。

## <a name="demo2"></a>2、plupload的原理
`plupload` 是一个文件上传的前端插件。

[它的主页](http://www.plupload.com) [它的github地址](https://github.com/moxiecode/plupload)

demo2并没有使用 `plupload`，事实上它是自己实现了 `plupload`，它本身就相当于 `plupload` 的 v0.01 版本。

通过 v0.01，这20行代码来一窥 `plupload` 的原理。而不是去读 `plupload` 的上万行代码，
真是，两岸猿声啼不住，轻舟已过万重山，一日千里。

`plupload` 的原理，就是拿到文件句柄后，自己发送(XMLHttpRequest)文件。
尽量控制整个过程，从中加入自己实现的功能，这就是它的想法。

* 比如，图片预览，是在拿到文件以后在新的 canvas 上画出新的尺寸。
* 比如，断点续传，是在拿到文件以后 slice 文件，从断点处开始读取。

这些操作，都有个前提，就是要拿到文件。否则，一切无从做起。

## <a name="demo3"></a>3、mOxie文件选取和文件预览

这个例子没有服务端，请直接用浏览器打开 `demo3/index.html`。然后选取图片，就可以看到预览。
这样避免你想当然的认为，预览是服务端辅助的。

NOTE: h5 是无法直接在 img 标签中嵌入本地图片预览的。本例使用 canvas 在页面上画出缩略图。

<img src="img/3.1.png" width="500">

文件预览一般的做法是，先上传图片，然后从图片服务器上下载 thumbnail，这么做是有缺点的，预览要先上传才能看到（可能人们更喜欢先看到再决定要不要上传）。但是这里采用的做法不同，它在本地进行预览，但这势必会增加一些 cpu 的开销，因为预览的实质是进行了图片压缩（要么服务端压缩要么客户端压缩而已）。

实际生产中，采用哪一种做法，要看需求，或者看你方便的程度。如果需求中要求节省流量，或有上传前删除功能，那就采用本地预览（也就是本例的做法）。如果服务器能存储压缩后的 thumbnail，且压力不大，速度够快，那就用服务端预览。

另外，
当你看到 mOxie 的时候，可能会觉得莫名其妙。是这样的

打开 http://www.plupload.com/docs/

文档的最后一段话如下
> * Low-level pollyfills (mOxie)
> * Plupload API   
> * UI Widget  
> * Queue Widget  

其实我写本文的初衷，是为了解释这四句话。
我跟你一样，一开始读不懂。

这四句话的意思是
 `plupload` 有四个安装等级 － 初级，中级，高级，长级

* 初级，叫 moxie.min.js，插件大小77k到106k不等（神马鬼？为什么不等的原因参见  [编译 mOxie](docs/compile.md) 一节）。
    其中提到的 pollyfills 应为 **polyfills**，是帮助老浏览器跟上 h5 步伐的插件，叫 **h5 垫片**，用 js 提升老浏览器的 api，抹平浏览器间的差异。所以 mOxie 其实是个通用前端库。
* 中级，plupload.full.min.js，插件大小123k
      打开它看一下，发现它其实是 moxie.min.js 和一个叫 plupload.min.js 的文件合并到一起而已。
      所以 `plupload` 其实是在 mOxie 的基础上，封装了一下文件上传 api，专业文件上传前端库。
* 高级，它依赖
      jquery       137k
      jquery ui    282k
      plupload     123k
      plupload ui  30k
      一共约600k的大小。帮助你实现 ui，叫 widget － 小组件。
* 巨级，它和高级差不多，也是实现一套 ui。区别是 ui 是队列，前者的 ui 是块和列表。

那么回过头，再来看这个例子。这个例子只是演示文件选择，它没有上传的功能。
只有文件选择功能的 `mOxie` 插件的大小为77k，比正常功能要小30%。为什么呢？

因为 `mOxie` 是一个可以自定义的前端库，如果有些功能不需要，比如 silverlight，那么就可以不把它们编到目标中。 参见 [编译 mOxie](docs/compile.md)

那么 `mOxie` 都做了什么呢，为甚么有77k这么大（大吗？）的体积。它提供文件预览功能、图片压缩功能、国际化支持（就是 i18n ）等。同时，上面也提到，它解决浏览器的兼容性问题。

## <a name="demo4"></a>4、mOxie文件上传，进度提示

这个例子只使用 `mOxie` 提供的功能，实现了**文件上传**。

~~~
$ ls -l demo[3-4]/moxie.min.js
-rw-r--r-- ktont  staff  73499  13:53 demo3/moxie.min.js
-rw-r--r-- ktont  staff  77782  13:58 demo4/moxie.min.js
~~~
您会发现，本例中的 `mOxie` 库比上一例多了4k，那是因为在编译的时候加入了 XMLHttpRequest 的支持。
所以 demo4 中的 moxie.min.js 就是 `plupload` 库能投入生产的最精简版本。参见 [编译 mOxie](docs/compile.md)

您可以在这个 demo 的基础上实现自己的文件上传。相比 `Plupload API`，它更灵活，您可能更喜欢在这个**层次**上编写应用。当然，灵活性的对立面是复杂度，它们之间的平衡点因人而异。

### 怎么判断文件上传成功？

- 无论上传成功或者失败，结束时都会触发 loadend 事件
- 如果上传过程中服务器崩溃，那么 loadend 事件的附加值 info.status 为 0。也可以根据 xhr.status 为 0 
- 如果上传过程中用户 abort，那么结果将依赖于服务器的处理。服务器有可能返回成功也可能返回失败。
- 如果上传过程中网络中断或者超时，那么 那么 loadend 事件的附加值 info.status 为 0。也可以根据 xhr.status 为 0 
- 如果服务器返回的值 info.status == 200，则说明上传成功。否则，失败

NOTE: 关于 abort

这似乎是一个bug，因为当用户主动 abort 时，并没有触发 abort 事件。
所以你要想正确的 abort 那么就要注意了。手工 abort() 后，要标记失败了。
最好用 Promise，abort() 后，立即返回 reject()

## <a name="demo5"></a>5、使用plupload实现了图片上传

这个例子，比较实际一点，使用 `Plupload API`。`Plupload API` 主要在 `mOxie` 上实现一套事件驱动的机制。

同时，顺带演习上传的暂停和重传。为甚么在这里演习暂停和重传呢？

为了区分下个例子 -- 断点续传。断点续传是指，**重启了电脑后断点续传**。

断点续传在上传大文件的场景下，很有用。
比如我上传一个电影，中间关闭了电脑，然后睡个觉。醒来后可以继续传。

下一个例子演示断点续传。

而本例的重传是说，不重启浏览器的前提下，重新传文件。它会从头再来，之前传的会丢弃。
实际场景中，用来重传图片这种小文件。
因为小文件一个封包或几个封包就发送完了，没必要断点续传，也没法儿**断**了。

## <a name="demo6"></a>6、断点续传  

是时候请出你的硬盘女神啦！运行本程序需要一个大文件，而电影文件再合适不过了。

<img src="img/6.1.png" width="500" />

选取文件后，并没有立即上传。而是去服务器询问上次传输的断点。
在本例中，服务端会返回一个50到100的随机值，它表示百分比，用来模拟实际情况中的**上次的断点**。

例如，下面图片中，上次的断点是94%

<img src="img/6.2.png" width="500" />

你可能会误认为服务器会从94%的地方把数据存起来，不是的，
它的意思是告诉客户端，**请从文件94%的地方把剩下的数据发送过来**。

服务端的情况

<img src="img/6.3.png" width="500" />


本例中使用的**块**大小是1兆字节，这个配置在 `index.html` 的19行
>              chunk_size: '1mb'

上图中，两个绿色框之间是一次独立的 **http 交互过程**，它用来发送一个**块**。
本例中的文件一共4G多，会切成4千多个块。产生4千多次 http 交互来发送它们。
相比不分块而一次 http 发送完所有数据，这么做会有些网络性能损耗。但是不分块的缺点是非常明显的。

如果真的不分块，单 http 发送所有数据。假设网络异常，服务端 hanging，客户端此时开启另一个链接 retry。
retry 首先询问服务端**上次的断点**，然后从该断点处继续发送。
之前 hanging 的链接可能已经 hang up，也可能没有，这取决于服务端的超时时间。

此时，服务端就会面临一个尴尬的选择，必须关闭之前 hanging 的链接
。因为如果不关闭，网络中残留的数据可能继续写入文件，导致数据错乱。 
服务端一般请求间是无法操作的，一个请求不能操作其它请求。

<img src="img/6.4.jpg" width="500" />

虽然，实际上几乎不会出现上面的情况，但是它不严谨。并且，
http 协议是一个应用层协议。http 协议在 **application** 和 **network transfer** 更靠近 **application**。大多数 http 服务器都会帮你做封包的拼解工作，而让你从网络层传输层解放出来。如果达不到这一点，http 的处理还是和 tcp 一样麻烦，那 http 就不应该存在。[参考 http协议](https://www.w3.org/Protocols/rfc2616/rfc2616-sec1.html)

然而，如果分块来传输，就不会遇到这个问题。如果链接 hang up。那么整个请求的数据统统丢弃，偏移仍然在当前**块**。

话说回来，所以要把文件数据拆分成一个较小的单元来用 http 传输，并且
* 用块发送可以降低 token 冲突的概率。上传文件是使用一个随机 token 来标记数据边界(第一个绿框)的。
当文件大的时候，会有可能遇到和 token 一样的字符串。但是，分块传，会每次都换一个 token。
* 适当的**块**大小，有助于浏览器读取文件。比如本例中 chrome 用的是 slice 读取文件，我们不能指望它很智能，塞给它一个很大的文件，让它很好的处理。有些浏览器对文件大小有限制，甚至在传大文件的时候会卡死。

上图中，红色的框表示当前传输的是**第几块**数据。因为服务端给了随机值94%，所以这里是4261的尾部 -- 4005。

黄色的框表示一共有多少块数据。当红色和黄色相等的时候，表示文件传输完成。

灰色的框表示传输的二进制数据，数据的边界由第一个绿框定义。这个时候，这次 http 交互就完成了，链接会被关闭。紧接着会是下一块数据，一个全新的 http 交互，token 也会是一个新的。

断点续传的关键在于 －－**从文件的指定偏移处读取** (__ZHUANGBI__: c语言中 fseek)

但是浏览器提供给前端的功能都是受限的，没有 `fseek`，而是提供了一个 `slice` 功能。
比如，`slice(off, off+1024)` 用来读取 off 处的1024字节数据。
还能凑合着用吧，那我们每次读一块数据，然后发送，再读下一块，再发送。。。

突然发现，这不就是失传已久的 **socket 编程** 吗？搞一个 **缓冲**，撸一串数据然后发出去，再撸一串数据再发出去。

好吧！幸亏不是让我们写这种恶心的数据解析工作，`plupload` 已经给我们写好了，我刚撸起的袖管赶紧放了下去。


## <a name="demo7"></a>7、plupload ui widget的示例

这个例子，用来展示 plupload 的 `UI Widget`。

<img src="img/7.png" width="600" />

在 index.html 中，ui 部分只需安置一个 div
>    <div id="uploader"></div>    

plupload 会在这个 div 中，自动**安插**一个 ui 组件，就是图片中展示的那个。

这样极大的方便了开发，你可能一句 js 都没写，就实现了复杂的图片上传。
当然，你可以定制这个组件，那样需要一些学习成本，并且挺高的。所以，如果你想要一个轻量，自定义的 ui 组件的时候，就需要自己设计 ui 了。
比如下面这样的

<img src="img/7.1.png" width="300" />

在上面这个组件中，要求

* 最多只能选n张
* 更好的用户体验 
* 可以删除节点
* 上传失败后可以重传
* 页面大小控制在100k以内

## <a name="demo8"></a>8、nodejs上传显示进度、服务端限速

本示例研究了两个小技术
* nodejs上传显示进度 
* 服务端限速

```
node demo8/client.js
得找一个大文件才能看出效果
```

这两个小技术，用 stream 就能搞定。

nodejs上传显示进度，用 readable stream 的 data 事件
服务端限速 用 readable stream 的 once() pause() resume()，实现有些精巧，自己去看吧。它每秒限定 64k。调整 timer 可以实现任意速率限速。

另外，demo8/client.js 研究了 github.com/request/request 库如何 abort 一次上传

在控制台直接输入几个回车，然后输入 abort ，就会 abort 这次上传。如图：

<img src="img/8.png" width="400">

## <a name="demo9"></a>9、FAQ 批量上传的时候，如何为每个文件添加一个id

这是个真实的案例。

有人问我如何实现下面两点：
- 批量上传的时候，如何为每个文件添加一个uuid
- 如果文件小于 10M，则没有必要分块传输

这两个问题是同一个问题。答案很简单。

使用 plupload 的 BeforeUpload 事件 和 setOption 方法

<img src="img/9.png" width="400">

## <a name="end"></a>总结

这篇文章好像变成了对 plupload 的讲解。

其实，我的初衷是探讨 web 环境下文件上传。

但是，在随后2年的开发中，我又开发了桌面端，服务端的文件上传和下载。它们
的相关经验也记录在这里了。 demo8 就是这时候产生的。



