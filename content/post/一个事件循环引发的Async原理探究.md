+++
title = "一个事件循环引发的Async原理探究"
date = "2020-10-06T13:17:27+08:00"
author = "KuTuGu"
cover = "/images/eventLoop/async.png"
tags = ["前端知识点"]
keywords = ["事件循环", "Async"]
description = "记录一个偶然发现的前端事件循环问题，深入了解Async的实现原理"
showFullContent = false

+++

# 一个事件循环引发的Async原理探究

## 起因

最近在复习前端`事件循环`机制，在无意间修改了下代码，返回了不一样的结果。代码简化如下：

```JS
function testSometing() {
	return "testing...";
}

async function test() {
  console.log("test start...");
  const v1 = await testSometing();
  console.log(v1);
  console.log("test end...");
}

test();
console.log("suspend!");

new Promise((resolve) => { 	
  resolve("promise");
}).then(val => console.log(val));

/* 输出
test start...
suspend!
testing...
test end...
promise
*/
```

## 微调 -- 声明async

现在的输出结果完全正常，是常见的事件循环，具体流程不再赘述，下面来微调一下代码：

```JS
// 只是函数声明微调为async
async function testSometing() {
	return "testing...";
}

async function test() {
  console.log("test start...");
  const v1 = await testSometing();
  console.log(v1);
  console.log("test end...");
}

test();
console.log("suspend!");

new Promise((resolve) => { 	
  resolve("promise");
}).then(val => console.log(val));

/* 输出
test start...
suspend!
testing...
test end...
promise
*/
```

`async`和`await`的语法糖使得`Promise`的`链式调用`转为`同步`的写法。      

我们常常`await`一个函数，这里的执行顺序需要注意：

- 执行到这个语句会先执行`await`后面的函数，获得一个返回值，`await`会将其`"修饰"`为一个`Promise`对象，再`"中断跳出"`；
- 执行完`后面代码`后，再返回函数内，等待`Promise`状态转为`最终态`，再次执行`函数内代码`。

而`async`函数会返回一个`Promise`对象，所以我们常常`await`一个`async`函数的返回值。          

综上所述，这个微调合情合理，且无影响。但是当我们再来微调下：

## 微调 -- 显式返回Promise

```JS
async function testSometing() {
	// 只是函数返回值显式声明为Promise
	return Promise.resolve("testing...");
}

async function test() {
  console.log("test start...");
  const v1 = await testSometing();
  console.log(v1);
  console.log("test end...");
}

test();
console.log("suspend!");

new Promise((resolve) => { 	
  resolve("promise");
}).then(val => console.log(val));

/* 输出
test start...
suspend!
promise
testing...
test end...
*/
```

细心的童鞋已经发现了，让我们再来看下输出队列，`'promise'`的输出提前了。     

`async`不是会返回`Promise`对象吗？现在我们只是`显式声明`呀，为什么顺序会发生变化？

## 定位问题

我们再简化一下代码：

```JS
// 隐式返回Promise
async function testSometing() {
	return "testing...";
}
testSometing()

/* 输出
Promise {<resolved>: "testing..."}
*/



// 显式声明Promise
async function testSometing() {
	return Promise.resolve("testing...");
}
testSometing()

/* 输出
Promise {<resolved>: "testing..."}
*/
```

诶，为什么又一致了？难道是`await`的原因？

但`await`是一个黑盒，直接打`断点`调试，发现底层有很多事件循环的源码。   

尝试`编译`，但`babel`官方`async`编译插件只支持转为`generator`。emmm，那`yield`和`await`有什么区别...

看看有没有第三方插件，有两个有bug，第三次输出结果和前两个一样，不符合`ES6`标准（→_→）

那只能去找些[polyfill](https://github.com/lfp1024/promise/blob/master/src/async-await/async-await.js)看看，让我们修改一下代码：

```JS
// 隐式返回Promise
function testSometing() {
	return "testing...";
}

_async(function test() {
  console.log("test start...");
  _await(_async(testSometing))(val => {
    console.log(val);
    console.log("test end...")
  })
})

console.log("suspend!")

new Promise((resolve) => { 	
  resolve("promise");
}).then(val => console.log(val));

/* 输出
test start...
suspend!
testing...
test end...
promise
*/
```
上面我们曾提到了`await`的执行顺序，但还有些细节需要我们深究：

- `await`的`"中断跳出"`实现，只是将函数内下面的代码全部封装到`Promise`回调中，函数内没有代码执行，自然跳出函数，执行`后面代码`；      
- `await`是怎么`"修饰"`返回值为`Promise`的？`await`内部通过`Promise.then`来实现（见下文）；    
- 接下来只需要等待`Promise`转为`最终态`，执行后面回调即可；多个`await`就是多个嵌套的回调函数。   

我们也看到了上面的输出和之前的隐式输出一致，那显式呢？
      
```JS
// 显式声明Promise
function testSometing() {
	return Promise.resolve("testing...");
}

_async(function test() {
  console.log("test start...");
  _await(_async(testSometing))(val => {
    console.log(val);
    console.log("test end...")
  })
})

console.log("suspend!")

new Promise((resolve) => {
  resolve("promise");
}).then(val => console.log(val));

/* 输出
test start...
suspend!
promise
testing...
test end...
*/
```

输出结果一致！

但根据代码，显式和隐式的`await`似乎并无不同，反而是传入`async`的函数返回值存在差异，看来问题似乎出现在`async`内部。

## polyfill源码分析

我们下面贴下源码，深入分析：

```JS
// 接受一个函数参数，根据情况执行，并将返回值封装为一个Promise对象
const _async = (func) => {
  const p = new Promise((resolve, reject) => {
    // 捕获同步错误
    try {
      // 返回值
      const value = func()
      // 检查返回值是否是 对象 | 函数，它们可能是thenable对象
      if (
        (
          (typeof value === 'object' && value !== null) ||
          typeof value === 'function'
        ) &&
        typeof value.then === 'function'
      ) {
        /* 
         * 如果是thenable对象
         * 将其解析封装为Promise对象，并递归调用then函数
         * 最终解析为非thenable值返回
         */
        Promise.resolve(value).then(resolve, reject)
      } else {
        // 如果不是直接将其状态转为最终态
        resolve(value)
      }
    } catch (error) {
      reject(error)
    }
  })
  // 返回Promise对象
  return p
}

/* 
 * 接受一个任意参数，返回一个高阶函数
 * 这个高阶函数接收两个参数，分别代表await后，应该执行的正常回调函数和发生错误的回调函数
 */
const _await = (arg) => (onResolved, onRejected) => {
  /* 
   * 将参数解析为Promise对象，再为其添加回调函数
   * 如果有onRejected回调函数参数
   * 先通过catch解析期间可能产生的错误
   * 再执行onResolved回调函数
   */
  const innerPromise = onRejected ?
    Promise.resolve(arg)
      .catch(onRejected)
      .then(onResolved, onRejected) :
    Promise.resolve(arg)
      .then(onResolved, onRejected)
  return innerPromise
}
```

实现原理大家可以跟着上面的源码和注释走一遍，注意一些实现细节：
- 为什么会多次调用[Promise.resolve](https://github.com/lfp1024/promise/blob/master/src/promise/promise-es6.js#L173)
- `_async`是怎么解析`thenable`对象的

`注意`：`Promise`的原型实现有多个规范，虽然现在的标准是[Promises/A+](https://promisesaplus.com/)，但`ES6`的实现和`A+`仍有出入。

> 上面源码中`Promise.resolve`在两个函数都有出现
>
> 对于`_async`，`Promise.resolve`将`thenable`对象`递归解析`为`Promise`对象，然后通过另一个`then`将值`递归解析`为`非thenable`类型，赋值给返回的`Promise`对象。
>
> 对于`_await`，`Promise.resolve`是将传入的参数封装为`Promise`对象，再为其添加传入的回调函数
>
> 我们重点分析`_async`的`Promise.resolve(value).then(resolve, reject)`这一行代码：
>      
> ---------------------------------------------       
>       
> 首先`value`是一个`thenable`对象，即有一个`then`的函数属性。
> 
> 我们跟着代码进入[Promise.resolve](https://github.com/lfp1024/promise/blob/master/src/promise/promise-es6.js#L173)：
> - 如果`value`是`Promise`就直接返回
> - 如果不是则返回一个新的`Promise`对象`result`，生成的过程如下：
>   - 如果`value`不是`thenable`对象，直接将`result`的状态转为`最终态`，并赋值
>   - 如果`value`是`thenable`对象，则将一个回调函数推入`微任务队列`
>     - 这个回调函数是为了`递归解析value`，直到获取最终的一个`非thenable`类型，并赋值
>     - 具体执行顺序（按源码行号）：
>       - L181，调用`value`自身的`then`函数，传入`result`的`resolve`、`reject`
>       - L68，我们按`resolve`被调用来处理，判断`value`类型
>         - L74，如果是`Promise`对象，调用`Promise`的[then](https://github.com/lfp1024/promise/blob/master/src/promise/promise-es6.js#L111)，传入`result`的`resolve`、`reject`
>         - L82，如果是其他`thenable`对象，调用`thenable`对象的`then`，传入`result`的`resolve`、`reject`
>       - 自此进入`递归解析`过程，直到获取最终的一个`非thenable`类型
>       - L89，赋值，`result`的状态转为`最终态`
>
> 终于`Promise.resolve`执行完成，返回一个新的`Promise`对象。
> 
> 但这个对象的值不一定是`非thenable`类型，因为`Promise.resolve`没有对`value是Promise`做解析
> 
> 而这个解析过程通过再次调用`then`来完成，解析完成后，[赋值](https://github.com/lfp1024/promise/blob/master/src/promise/promise-es6.js#L90)到`_async`的返回值对象中。
>
> 综上所述，`Promise.resolve`的作用就是可以将`所有参数类型`封装为`Promise`；在遇到`thenable`对象（`非Promise`）时会调用`resolve`做递归处理，直到解析到一个`非thenable`类型
> ------
>
> 而`then(resolve, reject)`的作用有两个，一方面调用`resolve`做递归处理，另一方面将解析到的`非thenable`类型通过`resolve`赋值
> ------

## 解决问题

终于，我们明白了`_async`的实现原理，下面我们再分析之前的问题就很简单了，分析下显式调用流程：

- `_async`修饰`test`函数：
  - 输出`'test start...'`
  - 调用`_await`
    - `_async`修饰`testSometing`，得到`value`为`Promise {<resolved>: "testing..."}`
    - `value`是`thenable`对象，`Promise.resolve`封装会直接返回
    - `value.then(resolve, reject)`会被放到`微任务`队列`[1]`
    - 返回值`Promise {<pending>: undefined}`
    - `Promise.resolve`封装会直接返回，再将`then`传入的回调函数放入新`Promise`的队列中
  - 无返回值
- 输出`'suspend!'`
- 实例化`Promise`，状态转为`最终态`，并赋值，`then`回调放入`微任务`队列`[1， 2]`
- 清空`微任务`队列，执行1会把新`Promise`的状态转为`最终态`，并将回调放入`微任务`队列`[2， 3]`
- 继续清空`微任务`队列，输出`'promise'`、`'testing...'`、`'test end...'`

而隐式调用流程中因为`value`是`非thenable`类型，所以会直接返回给`_await`，从而将`_await`的回调提前放入`微任务`队列。

## 其他思路

其实有一个错误不知道大家有没有发现，在我们第一次定位问题的时候，我们简化了代码，只输出`async`的两种情况，但结果却似乎完全一致。      

其实这是因为我调试失误的原因(￣ε(#￣)，我没有打`断点`，而是直接在调试台查看最终输出。最终异步队列全部清空，结果肯定是一致的。          

然后我们认为是`await`的原因，所以直接抛弃了`babel`转译，其实将`async`编译为`generator`也可以解决这个问题(￣▽￣)"，编译代码如下:

```JS
// 让我们再次简化一下源代码：
async function testSometing() {
	return Promise.resolve("testing...");
}

// 编译后：
let testSometing = (() => {
  var _ref = _asyncToGenerator(function* () {
    return Promise.resolve("testing...");
  });

  return function testSometing() {
    return _ref.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) {
  return function () {
  	// fn执行完后，生成gen指针引用
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          /*
           * 调用next方法后
           * done变为true
           * value即返回的Promise {<resolved>: "testing..."}
           */
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }
        // 进入if，执行传入的resolve
        if (info.done) {
          /*
           * 进入resolve源码
           * 由于value是Promise，所以会将value.then推入微任务队列
           * 然后去执行其他代码，比如实例化一个Promise
           * 然后清空微任务队列，执行value.then
           * 此时才会执行resolve的赋值语句，将其他回调函数推入微任务队列
           */
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }
      return step("next");
    });
  };
}
```