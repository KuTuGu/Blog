+++
title = "React新版本为什么要移除掉一些生命周期"
date = "2020-08-26T23:26:03+08:00"
author = "KuTuGu"
tags = ["前端框架"]
keywords = ["React", "生命周期", "Fiber架构"]
cover = "/img/react/react-lifeCycle.png"
description = "从React移除一些生命周期的角度来看React新版本架构的迭代调整"
showFullContent = false

+++

# React新版本为什么要移除掉一些生命周期？

从上图新版本React的生命周期来看，React废弃了以下三种生命周期钩子：

- `componentWillMount`
- `componentWillReceiveProps`
- `componentWillUpdate`

下面我们来逐一分析它们被废弃的原因：

## componentWillReceiveProps

此方法将会被`getDerivedStateFromProps`这一静态方法取代，通过返回一个对象来表示新的state。             

看似并无区别，但使用`getDerivedStateFromProps`的原因在于对API的进一步解耦。           
此方法是静态的，所以无法获取或者执行实例上的其他副作用函数，只专注于根据当前的`nextProps`来更新组件的`state`。       

原来的`componentWillReceiveProps`函数内，this上的其余副作用函数可以在`componentDidUpdate`中进行。      

一方面，React通过API规范来约束开发者，强调代码书写的`规范性`。      
另一方面，通过将`状态变化`和`副作用`分离到`Fiber`架构的`Reconciliation`和`Commit`两个阶段，优化性能（详情见下文）。      

## componentWillMount

很多开发者喜欢在`componentWillMount`中获取异步数据，希望可以提早进行异步请求，尽量避免白屏。首先，这一想法不无道理，分两种情况考虑：          
- 立即获取数据，在第一次render之前处理完成，避免白屏          
- 异步获取数据，第二次render进行有效绘制，与`componentDidMount`相比白屏时间缩短        

当然，官方对于这一解释是：`componentWillMount`、`render` 和 `componentDidMount` 方法虽然存在调用先后顺序。        
但在大多数情况下，几乎都是在很短的时间内先后执行完毕，几乎不会对用户体验产生影响。            

看样子在`componentWillMount`似乎并无不妥之处，反而还可能会优化效率，为什么会被废除呢？主要原因有以下几点：

- 对于服务器渲染（`ssr`），在`componentWillMount`内获取数据可以保证返回的页面是最终页面，但存在一个问题：客户端渲染时会再次请求，会`浪费IO资源`。        
- 对于服务器渲染（`ssr`），在`componentWillMount`中绑定事件，但由于并没有后续的生命周期，导致资源无法释放，可能产生`内存泄露`。
- 客户端渲染也有可能产生上面两个问题，在`Fiber`架构中，`componentWillMount`所在的`Reconciliation`阶段可能被多次打断，可能产生多次网络请求或多次事件监听（详情见下文）。

## componentWillUpdate

`componentWillUpdate`也是如此：
- `componentWillUpdate`可能被多次打断，在这个钩子获取`更新前的视图情况`或执行副作用都不妥
- `getSnapshotBeforeUpdate`是真正在视图变更前调用的，获取到组件状态信息更加可靠；     
另一方面`getSnapshotBeforeUpdate`的返回结果可直接作为参数传入`componentDidUpdate`中。   

## Fiber核心架构

从上面三个生命周期的移除都可以看到`Fiber`架构的身影，下面我们就来深入了解下：

React新版本的到来，与之相应的是`核心架构`的替换和`异步渲染`概念的引入。

React框架的视图更新取决于`virtual dom`和[diff算法](https://juejin.im/post/5cb5b4926fb9a068b52fb823)，找到变化之后再将新的`virtual dom`渲染到不同视图(如android、pc)，这一通用的过程称为`Reconciler`。     

旧版本的React使用的是`Stack Reconciler`，新版本采用的是`Fiber Reconciler`，因为其中任务调度处理的最小单元为`Fiber`数据结构：    

```js
// Fiber 基于链表结构，拥有一个个指针，指向它的父节点子节点和兄弟节点。
// 在 diff 的过程中，依照节点的链接关系进行遍历
Fiber = {
 'tag'       // 标记任务节点类型
 'return'    // 父节点
 'child'     // 子节点
 'sibling'   // 兄弟节点
 'alternate' // 变化记录
 // .....
};
```
两者的主要区别在于：
相比于`Stack Reconciler`的递归调用渲染，虽然diff算法被React优化为`O(n)`复杂度，但对于特别庞大的dom树来说，递归调用依旧会消耗特别长的时间，在这期间任何交互都会被阻塞。   

`Fiber Reconciler`引入了异步渲染的概念，虽然也是根据Fiber数据结构进行链式处理，但可以将其切割为一个个小任务，异步进行处理，避免堵塞高优先级的交互等事件：

> `Fiber`的出现把`Reconciler`的过程拆分成了一个个的小任务，并在完成了小任务之后暂停执行，检查是否有`高优先级`需要更新的内容和需要响应的事件，做出相应的处理后再继续执行。
>
> `Fiber`还会为不同的任务设置不同的优先级：
> - 高优先级任务是需要马上展示到页面上的，如`用户交互`、`动画`等。       
> - 低优先级的任务如`网络请求`、`state变更`等，可以在后面进行延迟处理。         
当然React会为其指定[阈值](https://www.zhihu.com/question/405268183)，避免长期被高优先级打断。
> 
> ```js      
> // 一些优先级划分参考如下：   
> {     
>   Synchronous: 1, // 同步任务，优先级最高           
>   Task: 2,        // 当前调度正执行的任务         
>   Animation 3,    // 动画         
>   High: 4,        // 高优先级         
>   Low: 5,         // 低优先级          
>   Offscreen: 6,   // 当前屏幕外的更新，优先级最低  
> }    
> ```       

![Fiber阶段](/images/react/fiber-phase.png)

前面说了`Fiber`算法中更新是分阶段的，首先是`Reconciliation`阶段，这个阶段在diff前后`virtual dom`树的差异，耗时过长，可以打断；然后是`Commit`的阶段，这个阶段将一直把更新渲染到页面上。     

`Reconciliation`阶段有那些生命周期呢？没错，废除的三个生命周期赫然在列：

- `componentWillMount`
- `componentWillReceiveProps`
- `componentWillUpdate`
- `shouldComponentUpdate`，纯函数不会移除

### 推荐阅读

[零代码深入浅出React并发模式，带你理解React Fiber架构](https://juejin.im/post/5e1e9f33f265da3e2c247176#heading-16)            

## 事件循环 -- Fiber架构的实现原理


`Fiber`架构的`异步渲染`依赖的是浏览器底层的`事件循环`。         

我们知道浏览器的持续渲染页面依赖的就是事件循环机制，当页面文件解析后、脚本执行，会形成各种队列，之后就开始了页面的事件循环：        

- 各种宏任务队列（取一任务） => 微任务队列（全部执行） => 渲染（可能） => 计算空闲时间


上述循环基本完成在一帧（和`浏览器`刷新率有关，一般为60HZ或者更高）内，渲染阶段根据是否有足够时间选择是否执行。     

为了保证页面的流畅度，渲染帧数要保证在每秒60左右(和刷新率无关，当然高刷新率的渲染帧数一般会更高)     

由上述可知，这个渲染阶段是不可控的。而之前使用`setTimeInterval`来绘制动画：           

- 一方面可能被其他任务堵塞，造成`延迟`，或者在浏览器下次重绘之前调用多次，导致`掉帧`；         
- 另一方面固定的间隔在`不同刷新率`设备的适配上也有一定问题。

于是浏览器暴露了一些接口来细粒化地控制事件循环的绘制：`requestAnimationFrame`、`requestIdleCallback`。

![frame](/images/eventLoop/frame.jpg)

### requestAnimationFrame

简单来说，`requestAnimationFrame`内的回调函数会在浏览器下一次重绘之前执行，完美地解决了上述`setTimeInterval`的问题，而且如果标签页被隐藏，回调也会被暂停调用以提升性能和电池寿命。   

具体应用时需要注意两点：

- `requestAnimationFrame`只会要求浏览器在`下一次`重绘之前调用指定的回调函数，连续需要递归
- 在同一个帧中的多个`requestAnimationFrame`，它们的时间戳相同

### requestIdleCallback

由上述事件循环可知，每完成一次循环浏览器都会进行一次空闲时间的计算，而`requestIdleCallback`中的回调就将在这段时间内执行。

> 这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应。函数一般会按先进先调用的顺序执行，然而，如果回调函数指定了执行超时时间timeout，则有可能为了在超时前执行函数而打乱执行顺序。
> 
> 强烈建议使用timeout选项进行必要的工作，否则可能会在触发回调之前经过几秒钟。
> 摘自[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestIdleCallback)

`注意`：当页面无其他任务时，`requestIdleCallback`执行的周期会被适当拉长，但最长只能为`50ms`，以防出现`不可预测的任务`（如用户输入）来临时无法及时响应可能会引起用户感知到的`延迟`。      

![requestIdleCallback](/images/eventLoop/requestIdleCallback.png)

#### 推荐阅读

[Web 动画帧率（FPS）计算](https://www.cnblogs.com/coco1s/p/8029582.html)      
[浏览器帧原理剖析](https://juejin.im/post/5c9c66075188251dab07413d)    

### Fiber 架构渲染流程

![reconciler](/images/react/reconciler.png)

由此我们可以推断`Fiber Reconciler`大致的工作原理：
- 首次渲染执行，维护一个`virtual dom`，节点为`Fiber`数据结构，指向其他节点。
- 每次事件循环进入更新，在`Reconciliation`阶段，逐节点遍历，进行Diff、更新节点后，递归生成下一节点。
- 如果有其他`优先级更高`的任务，`中断执行`将控制权交由主线程，继续事件循环，之后再重新构建该节点，直到所有节点更新完毕。
- 进入`Commit`阶段，将新生成的`virtual dom`一次绘制到页面上。

#### 推荐阅读

[[译] 深入了解 React Fiber 内部实现](https://juejin.im/post/5ecb313d6fb9a0479a800294#heading-5)        
[这可能是最通俗的 React Fiber(时间分片) 打开方式](https://juejin.im/post/5dadc6045188255a270a0f85#heading-9)

## 关于Fiber具体实现的一些问题与思考

- `requestIdleCallback`的执行次数是可变的。如果页面正常60帧运行，其执行次数最多为60，可以保证正常绘制；       
但如果页面空闲呢？页面在1秒内只会低帧率运行，而`requestIdleCallback`的执行周期也被延长到最大`50ms`，1秒内只执行20次。   
于是React对`requestIdleCallback`进行了hack，源码解析见：
	- [你不知道的 requestIdleCallback](https://zhuanlan.zhihu.com/p/60189423)
	- [React Fiber原理解析](https://juejin.im/post/5ef8a83de51d45348c1dce46#heading-7)
	- [对react相关代码库以及框架的源码解析](https://github.com/BUPTlhuanyu/ReactNote/blob/master/README.md)

- 为什么要先`Reconciliation`再`Commit`？换句话说，为什么要先diff再patch？看似这里一次循环就可以执行，没必要分开进行两次。          
其实在旧树的基础上新生成一颗`WIP树`，可以将其类比为git的分支，只有分支的功能完全实现且没有错误时，才会合并到主分支。如果有节点抛出异常，还可以`复用旧节点`。

- `Fiber`真的有用吗？`Fiber`的意义在哪里？          
我们回想一下`Fiber`架构诞生的原因是什么，为了避免在`Reconciliation`(diff)的时候，调用栈`同步执行`消耗大量CPU执行时间，导致`堵塞`。这里存在两个问题：
	- `Reconciliation`会消耗16ms以上是一个不常见的场景，甚至除非是在进行动画，否则`100ms`内的延迟用户都是无感知的；
	- `Fiber`只是保证diff过程异步进行，但进行渲染消耗的时间任然是`一次性`的、不变的。     
	- 对于`React`中或许在大应用会有一些性能优化，但大部分场景无影响，反而开发这样一个架构的工作量很大。        
	- 而`Vue`通过`模板编译`和`依赖变更`策略在前期优化了很多性能，这也是[为什么Vue3中移除了time slicing](https://github.com/vuejs/rfcs/issues/89)
- `Fiber`的异步思想我们应该很熟悉了，相比于自己开发这样一个架构，为什么不采用类似`WebWorker`之类的多线程进行diff呢？这样优化不仅适应于React，对其他类似框架也同样适用。详情见：
	- [用web worker多核并行diff虚拟dom的操作存在哪些问题？](https://www.zhihu.com/question/270573836)
	- https://github.com/facebook/react/issues/3092
	- [Building an Async React Renderer with Diffing in Web Worker](https://medium.com/@azizhk/building-an-async-react-renderer-with-diffing-in-web-worker-f3be07f16d90)

## 参考

- [为什么废弃react生命周期函数？](https://segmentfault.com/a/1190000021272657)     
- [谈谈 React 新的生命周期钩子](https://zhuanlan.zhihu.com/p/42413419)          
- [React v16.3 版本新生命周期函数浅析及升级方案](https://juejin.im/post/5ae6cd96f265da0b9c106931#heading-8)         
- [React 重要的一次重构：认识异步渲染架构 Fiber](https://juejin.im/post/5bed21546fb9a049e93c4bac)         