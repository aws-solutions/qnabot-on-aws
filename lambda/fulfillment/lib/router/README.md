Router organizes and directs the flow of the fulfilment lambda function 

You set the middleware for the router using the add method
```js
var router=new Router()
router.add((res,rej)=>null)
```

router handles running the middleware in order and handling errors. Any behavior should be defined in the middleware
