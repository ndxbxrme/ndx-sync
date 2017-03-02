# ndx-sync 
### synchronizes two or more insances of an [ndx-framework](https://github.com/ndxbxrme/ndx-framework) app
install with  
`npm install --save ndx-sync`  
## example  
`src/server/app.coffee`  
```coffeescript
require 'ndx-server'
.config
  database: 'db'
.use 'ndx-socket'
.use 'ndx-sync'
```
## environment variables
|environment|config|required|description|
|-----------|------|--------|-----------|
|HOST|host|Yes|the server hostname, eg `https://myapp.com`|