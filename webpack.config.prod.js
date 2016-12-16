/**
 * webpack参考列表
 * —— 啃先生 http://www.cnblogs.com/giveiris/p/5237080.html
 * —— 空智 http://www.cnblogs.com/tugenhua0707/p/5576262.html
 * 以下路径通过：publicPath:'http://localhost:8080'，统一配置http方式实现
 * js路径：filename:'/js/[name].js，'采用绝对路径 
 * css路径:new extractTextPlugin( '/css/[name].css') ，采用绝对路径
 * img路径：{test:/\.(png|jpg)/,loader:'file',query:{name:'/images/[name].[ext]?[shanpm512:hash:base64:7]'}} 绝对路径
 * 
 * 关于同步加载和异步加载
 * 在写代码的时候要注意适度同步加载，同步的代码会被合成并且打包在一起；异步加载的代码会被分片成一个个chunk，在需要该模块时再加载，即按需加载，这个度是要开发者自己把握的，同步加载过多代码会造成文件过大影响加载速度，异步过多则文件太碎，造成过多的Http请求，同样影响加载速度。
 * >>同步加载：require('./module')；
 * >>异步加载：require.ensure）([./module],function(require){ $ = require('jquery')},'nameID');-->output.chunkFilename:[nameID].min.js
 * >>一个原则是：首屏需要的同步加载，首屏过后才需要的则按需加载（异步）
 */

// 引入path模块
const path = require('path');

// 引入webpack包
const webpack = require('webpack');

/**
 * 引入webpack插件模块
 */
// webpack-dev-server作为开发服务器，用于实时监听和打包编译静态资源，这样每当我们修改js、css等等文件时，客户端（如浏览器等）能够自动刷新页面，展示实时的页面效果。自带插件不需要引入 const devServer = require('webpack-dev-server');
// 创建html，自动插入样式、脚步等资源
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 内联css提取到单独的styles的css
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// 生成一个记录了版本号的文件
const AssetsPlugin = require('assets-webpack-plugin');
// browser-sync在webpack上的应用
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');


/**
 * 定义输入输出路径
 */
//定义了一些根路径root文件夹的路径
const ROOT_PATH = path.resolve(__dirname);
//定义了一些开发src文件夹的路径
const SRC_PATH = path.resolve(ROOT_PATH,'src');
//定义了一些开发生产build/dist文件夹的路径
const BUILD_PATH = path.resolve(ROOT_PATH,'build');
// 定义host
const host = '192.168.0.132';
// 定义port
const port = '2016';


module.exports = {
    entry:{
        main:SRC_PATH + '/js/main.js',
        jquery:['jquery'],
        lodash:['lodash'],
        axios:['axios']
    },
    output:{
        path:BUILD_PATH,
        /**
         * ??缓存控制要做到两件事情，提到缓存命中率：1.对于没有修改的文件，从缓存中获取文件;2.对于已经修改的文件，不要从缓存中获取
         * >>Http头对文件设置很大的max-age，例如1年。同时，给每个文件命名上带上该文件的版本号，例如把文件的hash值做为版本号，topic. ef8bed6c.js。
         * >>即是让文件很长时间不过期。
         * >>1.当文件没有更新时，使用缓存的文件自然不会出错；
         * >>2.当文件已经有更新时，其hash值必然改变，此时文件名变了，自然不存在此文件的缓存，于是浏览器会去加载最新的文件。
         * @output.filename:可以相对于output.path,设置自己的位置与文件名
         * @filename:'js/[chunkhash:8].[name].js':-->当文件已经有更新时，其hash值必然改变，此时文件名变了，自然不存在此文件的缓存，于是浏览器会去加载最新的文件。浏览器给这种缓存方式的缓存容量太少了，只有12Mb，且不分Host。
         * @chunkFilename:'js/[name].[chunkhash:8].js'-->以文件名为Key，文件内容为value，缓存在localStorage里，命中则从缓存中取，不命中则去服务器取，虽然缓存容量也只有5Mb，但是每个Host是独享这5Mb的。
         */
        filename:'/js/[name].[chunkhash:8].js',
        // chunkFilename在按需加载（异步）模块的时候，这样的文件是没有被列在entry中的，如使用CommonJS的方式异步加载模块时候会使用到；
        chunkFilename:'/js/[name].[chunkhash:8].js',
        publicPath:'http://'+host+':'+port+'/build'
    },
    // 自定义公共库引用
    resolve:{
        // root:'d:/js', 
        extensions:['','.js','.jsx'],
        alias:{
            myFun : 'myFun.js'  //模块别名定义,后面直接引用 require(“a”)即可引用到模块
        }
    },
    module:{
        // loaders是有复数s
        loaders:[
            {test:/\.html$/,loader:'html?attrs=img:src img:data-src'},
            {test: /\.css$/, loader: ExtractTextPlugin.extract("style?sourceMap", "css?sourceMap") },
            {test: /\.less$/,loader: ExtractTextPlugin.extract('css?sourceMap!' +'less?sourceMap' )},
            //会动态转换成base64编码； file:表示file-loader简写，？limit=num:表示现在在numB内的图片base64压缩；[path][<hashType>:hash:<digestType>:<length>] .[name].[ext]:path是一个绝对路径开头的路径，hash保留8位
            { test: /\.jpg$/, loader: "file-loader?limit=5000&name=/images/[name].[hash:8].[ext]" },
            { test: /\.png$/, loader: "url-loader?mimetype=image/png&limit=5000&name=/images/[name].[hash:8].[ext]" },
            {test:/\.json$/,loader:'json',preset:'es2015',exclude:/node_module/},
            {test:/\.js$/,loader:'babel',preset:'es2015',exclude:/node_module/}           
        ]
    },
    plugins:[
        new webpack.HotModuleReplacementPlugin(),
        /**
         * 自动生成页面
         * ??文件名带上版本号后，每一次文件变化，都需要Html文件里手动修改引用的文件名，这种重复工作很琐碎且容易出错。
         * >>使用 HtmlWebpackPlugin 和 ExtractTextPlugin 插件可以解决此问题。
         * 
         */
        new HtmlWebpackPlugin({
            title:'app首页',                     //用于生成的HTML文件的标题。
            template:SRC_PATH +'/tpl/home.html', //模板文件路径，支持加载器，比如 html!./index.html
            filename:'../index.html',            //用于生成的HTML文件的名称，默认是index.html。你可以在这里指定子目录。
            inject:true,                         // true | 'head' | 'body' | false，如果设置为 true ,注入所有的资源(完整html骨架及静态资源)
            hash:true,                           //如果为 true, 将添加一个唯一的 webpack 编译 hash 到所有包含的脚本和 CSS 文件，对于解除 cache 很有用。main.js?3649dc165c260ceacfea
            minify:{
                removeComments:false,              //true移除HTML中的注释
                collapseWhitespace:false           //ture删除空白符与换行符
            },
            // 允许只添加某些块 (比如，仅仅 unit test 块)
            chunks:['jquery','axios','lodash','main'],
            /**
             * 允许控制块在添加到页面之前的排序方式
             * 支持的值：'none' | 'default' | {function}   -default:'auto'
             */
            chunkSortMode:function(a,b){
                var index = {'jquery':1,'axios':2,'lodash':3,'main':4},
                    aI = index[a.origins[0].name],
                    bI = index[b.origins[0].name];
                return aI&&bI?aI-bI:-1;
            }
        }),
        // 生成带css的页面
        new ExtractTextPlugin(
            '/css/[name].[hash:8].css'                      // 内联css提取到单独build/css/下的css,(./)不能省略
        ),
        // 内置插件压缩代码
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            },
            except: ['$super', '$', 'exports', 'require']    //排除关键字
        }),
        // 提取jQuery等库文件
        new webpack.optimize.CommonsChunkPlugin({
            names:['jquery','lodash'],         //将公共模块提取
            filename:'/libs/[name].[hash:8].min.js',     //将公共模块存储到libs下，并重新命名
            minChunks: Infinity                //提取公共模块
        }),
        new webpack.ProvidePlugin({
             $: "jquery"
        }),
        /**
         * html文件的版本号
         * 因此我们可以把该webpack.assets.js文件让开发在页面上引入即可；entry.name为入口文件；
         * >> <script src="build/webpack.assets.js?v=' + Math.random() + '"></script>
         * >> <script src="' + window.WEBPACK_ASSETS['entry.name'].js + '"></script>
         * >> <script src="' + window.WEBPACK_ASSETS['entry.name'].js + '"></script>
         *  */ 
        new AssetsPlugin({
            filename: BUILD_PATH+'/webpack.assets.js',
            processOutput: function (assets) {
                return 'window.WEBPACK_ASSETS = ' + JSON.stringify(assets);
            }
        }) 
    ],
    /**
     * 第三方库静态文件
     */
    externals:{
        animate:"http://cdn.bootcss.com/animate.css/3.5.2/animate.css",
        // jquery:"http://cdn.bootcss.com/jquery/3.1.1/jquery.min.js",
        // zepto:"http://cdn.bootcss.com/zepto/1.2.0/zepto.js",
        vue:"http://cdn.bootcss.com/vue/2.1.6/vue.js",
        // lodash:"http://cdn.bootcss.com/lodash.js/4.17.2/lodash.js",
        modernizr:"http://cdn.bootcss.com/modernizr/2010.07.06dev/modernizr.js"
    }
}