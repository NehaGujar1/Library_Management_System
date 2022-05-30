
const { name } = require('ejs');
const express = require('express');
const cookieParser= require("cookie-parser");
const sessions = require("express-session");
const db = require('./database');
db.connect();
const app = express();
app.set('view engine', 'ejs');

const oneDay =1000* 60* 60;
app.use(sessions({
    secret:"ewifheufhreuijfwoeidjeiufnreiufneiurfwaeiuherw",
    saveUninitialized: true,
    cookie:{maxAge:oneDay},
    resave:false
}))

app.use(cookieParser());
var session;

//Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//ENVs
const PORT = process.env.PORT || 8200;
app.listen(PORT, () =>
    console.log(`server started at ${PORT}`));

//Requests
const router = express.Router();

app.use('/',router);
router.get('/', (req, res) => {
    res.render('index');
});

//This have 2 arguments a route and a function with three arguments, request, response and next.
router.post('/login', (req, res) => {
        let name = req.body.name;
        let password = req.body.password;
        var crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(password).digest('base64');
       // let passwordC = req.body.passwordC;
        db.query("select * from client where name = " + db.escape(name) + ";",
            (error, result, field) => {
               if ( result[0] === undefined ) {
                    
                    res.send('User not registered');
                }
                else {
                    if (result[0] != undefined && result[0].password === hash) {
                        session=req.session;
                         session.userid=req.body.username;
                         console.log(req.session)
                        // return res.render('user');
                        //rem_books();
                        db.query("select * from books where name = " + db.escape(name) + ";",
                         (error, result, field) => {
                             console.log(result);
                            var bn = result[0].book_name;
                             db.query("select book_name from books where name is NULL",
                         (error, result2, field) => {
                             console.log(result2);
                             //res.send(result
                             
                             return res.render('user', { data: name, data2: result ,data3: result2 });

                            });
                         });
                        }
                        //console.log(bn);
                        
                    
                    else {
                        return res.render('notUser');
                    }
                }
                });
               // res.send('hello');
               // console.log(result[0]);
             } );


                        
router.post('/user', (req, res) => {
    console.log("hiiii");
    console.log(req.body);
    console.log(req.body.check_in);
    console.log(req.body.check_out);
    let book_issued  = req.body.check_in;
    let name = req.body.ur_book_name;
    let check_o_book = req.body.check_out;
    if(book_issued != null && check_o_book!=null){
    db.query("insert into aaaa values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
        (error, result, field) => {
            // if(error){
            //     throw error;
            // }
               console.log(result);
        });
    db.query("insert into aaaa values (" + db.escape(check_o_book) + ", " + db.escape(name) + ", '1' );",
        (error, result, field) => {
            // if(error){
            //     throw error;
            // }
               console.log(result);
        });
        res.send('Both done');
    }
    else if(check_o_book!=null){
        db.query("insert into aaaa values (" + db.escape(check_o_book) + ", " + db.escape(name) + ", '1' );",
        (error, result, field) => {
            // if(error){
            //     throw error;
            // }
               console.log(result);
        });
        res.send('No check-in done only check-out is done');
    }
    else if(book_issued!=null){
        db.query("insert into aaaa values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
        (error, result, field) => {
            // if(error){
            //     throw error;
            // }
               console.log(result);
        });
        res.send('No check-in done only check-out is done');
    }
    else{
        res.send('No changes done');
    }
});

router.post('/register', (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    var crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('base64');
    let passwordC = req.body.passwordC;
    db.query("select * from client where name = " + db.escape(name) + ";",
        (error, result, field) => {
            if ( result[0] === undefined ) {
                if (name && (password == passwordC)) {
                    db.query("INSERT INTO client VALUES(" + db.escape(name) + ",'" + hash+"');");
                    res.render('user', { data: name });
                }
                else if (password !== passwordC) {
                    res.send("Passwords didn't match");
                }
                else {
                    res.send("Password must not be empty");
                }
            }
            else {
                console.log(result);
                res.send("Username is not unique");
            }
        });
});

router.get('/register', (req, res) => {
    res.render(`register`);
});

router.get('/admin_login', (req, res) => {

    res.render(`admin_login`);
});
router.post('/admin_login1', (req,res) => {
    let name = req.body.name;
    let password = req.body.password;
    var crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('base64');
    db.query("select * from admin where name = " + db.escape(name) + ";",
            (error, result, field) => {
               if ( result[0] === undefined ) {
                    
                    res.send('User not registered');
                }
                else {
                    console.log(result);
                    if (result[0] != undefined && result[0].password === hash) {
                    db.query("select * from aaaa where check_r = '0';",
                    (error, result, field) => {
                        console.log(result);
                    db.query("select * from aaaa where check_r = '1';",
                    (error,result2, field) => {
                        //console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
                    db.query("select * from books;",
                    (error,result3, field) => {
                        console.log('hi');
                    console.log(result3);
                    return res.render('admin_login1',{data:name, data2:result, data3:result2, data4:result3});
                    console.log(name);
                    console.log(result);
                    console.log(result2);
                    
            });
        });
});
                    
}
}
});
});
router.post('/admin_login2',(req, res) => {
    let book_issued  = req.body.check_in;
    let check_o_book = req.body.check_out;
    let delete_book = req.body.delete;
    let add_new_book = req.body.add_new_book;
    //console.log("hiiii here");
    console.log(req.body);
    console.log(book_issued);
 //   console.log("217")
    console.log(delete_book)
    //console.log(book_issued[0].split(" "));
    //console.log(req.body.check_in);
    if(add_new_book!=''){
        db.query("insert into books(book_name) values('"+ add_new_book +"');");
    }
    if(delete_book!==undefined){

    for(let i=0;i<delete_book.length; i++){
        db.query("delete from books where book_name = '" +delete_book[i]+ "';");
        db.query("delete from aaaa where book_name = '" +delete_book[i]+ "';");
        console.log('Deleted');
    }
}
    //console.log(req.body.check_out[0]);
    if(check_o_book!==undefined){
    for(let i=0;i<check_o_book.length;i++){
        db.query("delete from aaaa where book_name = '" +check_o_book[i]+ "';");
        db.query("update books set name=null where book_name = '" +check_o_book[i]+ "';");
        console.log('Checked-out');
    }
}
    if(book_issued!==undefined){
    for(let i=0; i<book_issued.length;i++){
        var uname = book_issued[i];
        let k = uname.split(',');
     //   console.log("236")
     //   console.log(k);
        // db.query("delete from aaaa where book_name = '" +k[0]+ "';");
        // db.query("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
        console.log('Checked-in');
    }
}
    //db.query("delete from aaaa where ")
    res.send('Done');
}
);