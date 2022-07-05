'use strict';
// nodemon -e hbs, js server.js - tracking & auto update dynamic files
const Hapi = require('@hapi/hapi')
const Inert = require('@hapi/inert')
const path = require('path')
const Vision = require('@hapi/vision')
const BasicAuth = require('@hapi/basic')
const Boom = require('@hapi/boom')
   //--------------------------------------------------
const users = {
   tom: {
      username: 'Tom',
      password: 'soccer',
      id: 0,
      name: 'Tom Branks'
   },
   jerry: {
      username: 'Jerry',
      password: 'cheese',
      id: 1,
      name: 'Mouse Jerry'
   },
} 
const validate = async(req, username, password, h) => {
   if(!users[username]){
      return {isValid: false}
   }
   const user = users[username]
   if(user.password === password) {
      return {isValid: true, credentials: {id: user.id, name: user.name}}
   } else {
      return {isValid: false}
   }
}
   //--------------------------------------------------
const init = async () => {
   const server = Hapi.Server({
      host: 'localhost',
      port: 1234,
      routes: {
         //save path to static files
         files: {
            relativeTo: path.join(__dirname, 'static')
         }
      }
   })
   //--------------------------------------------------
   //register only for plugins
   await server.register([
      {plugin: require("hapi-geo-locate"),
         options: {enableByDefault: true}
      },
      {plugin: Inert},
      {plugin: Vision},
      {plugin: BasicAuth},
      {plugin: Boom},

   ])
   //--------------------------------------------------
   server.auth.strategy('login', 'basic', {validate})
   //login on every page
   server.auth.default('login')
   //--------------------------------------------------
   server.views({
      engines: {
         //dynamic 
         //hbs: require('handlebars')
         html: require('handlebars')
      },
      path: path.join(__dirname, 'views'),
      layout: 'default'
   })
   //--------------------------------------------------
   server.route([
      {
         method: 'GET',
         path: '/',
         //req.auth req.query req.path.... h.authenticated h.redirect h.response....
         handler: (req, h) => {
            //sending static files
            return h.file('welcome.html')
         }
      },
      {
         method: 'GET',
         path: '/dynamic',
         //render dynamic values on html
         handler: (req, h) => {
            const data = {
               name: 'Tom'
            }
            return h.view('index', data)
         }
      },
      {

         method: 'POST',
         path: '/login',
         handler: (req, h) => {
            //reach data from form
            console.log(req.payload.username);
            console.log(req.payload.password);
            if(req.payload.username) return h.file('logged.html')
            else
            return h.redirect('/')
         }
      },
      {

         method: 'POST',
         path: '/loginBasic',
         handler: (req, h) => {
            const name = req.auth.credentials.name
            return `welcome ${name}to my restricted page`
         },
         options: {
            //login - name of strategy in server.auth
            auth: 'login'
         }
      },
      {
         method: 'GET',
         path: '/logoutBasic',
         handler: (req, h) => {
            return Boom.unauthorized()
         },
         options: {
            //login - name of strategy in server.auth
            auth: 'login'
         }
      },
      {
         method: 'GET',
         path: '/download',
         handler: (req, h) => {
            return h.file('welcome.html', {
               mode: 'attachment',
               filename: 'welcome.html'
            })
         }
      },
      {
         method: 'GET',
         path: '/location',
         handler: (req, h) => {
            //return {"ip": "127.0.0.1"} // enableByDefault: true
            if(req.location)
            return req.location
            else
            return "<h1>Your location is not enabled by default"
         }
      },
      {
         method: 'GET',
         path: '/users',
         handler: (req, h) => {
            return `<h1>Users page </h1>`
         }
      },
      {
         method: 'GET',
         path: '/users/{user}',
         handler: (req, h) => {
            return `Hello ${req.params.user}`
         }
      },
      {
         method: 'GET',
         //localhost:1234/post?name=tom&lastname=wilman
         path: '/post/{q?}',
         handler: (req, h) => {
            return `Hello ${req.query.name} ${req.query.lastname}`
            
            //redirect
            return h.redirect('/')
         }
      },
      {
         method: 'GET',
         //localhost:1234/post?name=tom&lastname=wilman
         path: '/{any*}',
         handler: (req, h) => {
            return "<h1>oh no</h1>"
         }
      }

   ]) 

   await server.start()
   console.log(`server started on: ${server.info.uri}`);
}
   //--------------------------------------------------

process.on('unhandledRejection', (err) => {
   console.log(err);
   process.exit(1) 
})
init()