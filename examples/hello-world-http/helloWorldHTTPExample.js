const {Reshuffle, HttpService} = require('../../index');
const app = new Reshuffle();
const service = new HttpService();

app.use(service);

app.when(service.on({'method':'GET','path':'/test'}), (event) => {
  event.res.end("Hello World!");
});

// the above is syntactically equivalent to: 
//service.on({'method':'GET','path':'/test'}).do((event) => {
//    event.res.end("Hello World!");
//})


app.start();