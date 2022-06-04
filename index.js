
const { name } = require('ejs');
const express = require('express');
const cookieParser= require("cookie-parser");
const sessions = require("express-session");
const db = require('./database');
const { nextTick } = require('process');
const res = require('express/lib/response');
const req = require('express/lib/request');
db.connect();
require('dotenv').config();
const app = express();
app.set('view engine', 'ejs');

const oneDay =1000* 60* 60;
app.use(sessions({
    secret:process.env.secret,
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
const PORT = process.env.PORT || 8100;
app.listen(PORT, () =>
    console.log(`server started at ${PORT}`));

//Requests
const router = express.Router();

app.use('/',router);
router.get('/', (req, res) => {
    res.render('index');
});
//Client_login
router.get('/client_login',(req,res) => {
    res.render('client_login');
})
router.get('/done',(req,res) => {
    res.render('done');
})
router.post('/done',(req,res) => {
    req.session.destroy;
    res.render('index');
})
//This have 2 arguments a route and a function with three arguments, request, response and next.
router.post('/client_login', (req, res) => {
        let name = req.body.name;
        let password = req.body.password;
        var crypto = require('crypto');
        //console.log('hi');
       // let passwordC = req.body.passwordC;
        //console.log("select * from client_admin where name = " + db.escape(name) + " and role = 'user' ;");
        db.query("select * from client_admin where name = " + db.escape(name) + " and role = 'user' ;",
            (error, result, field) => {
                console.log(result);
               if ( result[0] === undefined ) {
                    let a = 'User not registered';
                    //res.send('User not registered');
                    return res.render('done',{data: a});
                }
                else {
                    if(result[0].salt!=null)
                    console.log(result[0].salt )
                    password = result[0].salt + password;
                    const hash2 = crypto.createHash('sha256').update(password).digest('base64');

                    if (result[0] != undefined && result[0].hash == hash2) {
                        session=req.session;
                        
                        req.session.uname=req.body.name;
                         console.log(req.session);
                         db.query("select books.book_name from books where isbn not in (select isbn from books_user where name = " + db.escape(name) + ");",(error, result2, field) => {
                             console.log(result2);
                             db.query("select books.book_name from books inner join books_user on books.isbn = books_user.isbn where name = " + db.escape(name) + ";",(error, result3, field) => {
                                db.query("select books.book_name from books inner join requests on books.isbn = requests.isbn where name = " + db.escape(name) + ";",(error, result4, field) => {
                                let a = "Logged in";
                                //res.send('Passwords didn't match');
                                return res.render('user_choices',{data: a, data1: result[0].name, data2: result2, data3: result3, data4: result4});
                             });
                             
                            }); 

                         }
                             )
                        }
                        //console.log(bn);
                        
                    
                    else {
                        let a = "Passwords don't match";
                        return res.render('done',{data: a});
                    }
                }
                });
               // res.send('hello');
               // console.log(result[0]);
             } );
// router.post('/user_choices',(req,res) => {
//     req.session.uname;
// });
router.get('/Check_in',(req,res) => {
    let name = req.session.uname;
//         db.query("select books.* from books left join books_user books_user.isbn = books.isbn where books_user.isbn is null and name is not "+db.escape(name)+";",
// (error, result2, field) => {
//             const arr = [];
            // for(i=0;i<result2.length;i++){
            //     db.query("select * from requests where isbn = "+db.escape(result2[i].isbn)+";",(error, result3, field) => {
            //         if(result3==undefined){
            //             arr.push(result3[0].isbn);
                        
            //         }
            //     }
            //         )
            // }
            db.query("select books.* from books left join books_user on books_user.isbn = books.isbn and books_user.name =" + db.escape(req.session.uname) + " where books_user.isbn is null and books.qty_left >0;", (error2, result2, field) => {
                if (error2) {
                    console.log(error2)
                    res.render("done",{data:'error'})
                } else {
                    db.query("select books.* from books left join books_user on books_user.isbn = books.isbn and books_user.name =" + db.escape(req.session.uname) + " where books_user.isbn is null;", (error3, result3, field) => {
                        if (error3) {
                            console.log(error3)
                            res.render("done",{data:'error'})
                        } else {
                            console.log(result2);
                          res.render("Check_in", { data: req.session.uname, data2: result2 });
                        }
                    })
                }
            })

            // console.log(name);
            // console.log(result2);
            // res.render('Check_in',{data:name, data2:result2});
        // })
    })
router.get('/Check_out',(req,res) => {
    let name = req.session.uname;
    db.query("select books.book_name from books inner join books_user on books.isbn = books_user.isbn where name = " + db.escape(name) + ";",(error, result2, field) => {
            console.log(name);
            console.log(result2);
            res.render('Check_out',{data:name, data2:result2});
        })
} );
router.post('/Check_in',(req,res) => {
    let name = req.session.uname;
    let book_issued  = req.body.check_in;
    if(book_issued!=null){
                if(typeof book_issued == "string"){
                    db.query("select * from books where book_name = " + db.escape(book_issued) + ";",(error, result, field) => {   
                        console.log(result);
                        let k = result[0].isbn;
            db.query("insert into requests values (" + db.escape(k) + ", " + db.escape(name) + ");",
                (error, result2, field) => {
                    db.query("select * from books where isbn = " + db.escape(k) + ";",(error, result2, field) => {
                        db.query("update books set qty_left = qty_left -1 where isbn = " + db.escape(k) + ";");   
                    })
                });
            });
            }
            else{
                for(let i=0; i<book_issued.length;i++){
                    db.query("select * from books where book_name = " + db.escape(book_issued) + ";",(error, result, field) => {   
                        console.log(result);
                        let k = result[0].isbn;

                    db.query("insert into requests values (" + db.escape(k) + ", " + db.escape(name) + ");",
                (error, result2, field) => {
                })});
                }
        
            }
        }
        res.render('done',{data:'Doneeeeeeee'});
    });
//
router.post('/Check_out',(req,res) => {
        let name = req.session.uname;
        let check_o_book  = req.body.check_out;
        if(check_o_book!=null){
    if(typeof check_o_book == "string"){
        db.query("select * from books where book_name = " + db.escape(check_o_book) + ";",(error, result, field) => {   
            let k = result[0].isbn;
            console.log(k);
db.query("delete from books_user where isbn = " + db.escape(k) + " and name = " + db.escape(name) + ";",
    (error, result2, field) => {
    })
db.query("select * from books where isbn = " + db.escape(k) + ";",(error,result3,field) => {
    db.query("update books set qty_left = qty_left +1 where isbn = " + db.escape(k) + ";",(error,result4,field) => { 
    });
});
})
}
else{
    for(let i=0; i<check_o_book.length;i++){
        db.query("select * from books where book_name = " + db.escape(book_issued) + ";",(error, result, field) => {   
            let k = result[0].isbn;
db.query("delete from books_user where isbn = " + db.escape(k) + " and name = " + db.escape(name) + ";",
    (error, result2, field) => {
    })
db.query("select * from books where isbn = " + db.escape(k) + ";",(error,result3,field) => {
    let p = result3[0].qty;
    p = p+1;
    db.query("update books set qty = " + db.escape(p) + " where isbn = " + db.escape(k) + ";",(error,result4,field) => { 
    });
});
})
}
    }

}
res.render('done',{data:'Completed'})

    });  

router.get('/register',(req,res) => {
    res.render('register');
}
)
router.post('/register', (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    var crypto = require('crypto');
    
    let passwordC = req.body.passwordC;
    db.query("select * from client_admin where name = " + db.escape(name) + " and role = 'user';",
        (error, result, field) => {
            if ( result[0] === undefined ) {
                if (name && (password == passwordC)) {
                    const salt = Math.random().toString(36).slice(2,12);
                    password = salt+password;
                    const hash = crypto.createHash('sha256').update(password).digest('base64');
        
                    db.query("INSERT INTO client_admin VALUES(" + db.escape(name) + ",'" + hash+"','"+salt+"','user');",(error, result, field) => {
                    // //db.query("select book_name from books where name is NULL",
                    //      (error, result2, field) => {
                    // res.render('user2', { data: name, data3: result2});
                        //  });
                        console.log(result);
                        let a = "Registration complete";
                    //res.send('Passwords didn't match');
                    let name = req.session.uname;
                    db.query("select books.book_name from books where isbn not in (select isbn from books_user where name = " + db.escape(name) + " and books.qty>0);",(error, result2, field) => {
                    console.log(name);
                    console.log(result2);
                    res.render('Check_in',{data:name, data2:result2});
                     })
                    });
                }
                else if (password !== passwordC) {
                   // res.send("Passwords didn't match");
                    let a = "Passwords didn't match";
                    //res.send('Passwords didn't match');
                    return res.render('done',{data: a});
                }
                else {
                    //res.send("Password must not be empty");
                    let a = "Passwords must not be empty";
                    //res.send('Passwords didn't match');
                    return res.render('done',{data: a});
                }
            }
            else {
                console.log(result);
                //res.send("Username is not unique");
                let a = "Username is not unique";
                //res.send('Passwords didn't match');
                return res.render('done',{data: a});
            }
        });
});
router.get('/admin_registration',(req,res) => {
    res.render(`admin_registration`);
}
)
router.post('/admin_registration', (req, res) => {
    let name = req.body.name;
    let password = req.body.password;
    var crypto = require('crypto');
    
    let passwordC = req.body.passwordC;
    db.query("select * from client_admin where name = " + db.escape(name) + " and role = 'admin';",
        (error, result, field) => {
            if ( result[0] === undefined ) {
                if (name && (password == passwordC)) {
                    const salt = Math.random().toString(36).slice(2,12);
                    password = salt+password;
                    const hash = crypto.createHash('sha256').update(password).digest('base64');
        
                    db.query("INSERT INTO admin_registration VALUES(" + db.escape(name) + ",'" + hash+"','"+salt+"');",(error, result, field) => {
                    // //db.query("select book_name from books where name is NULL",
                    //      (error, result2, field) => {
                    // res.render('user2', { data: name, data3: result2});
                        //  });
                        console.log(result);
                        let a = "Registration complete";
                    //res.send('Passwords didn't match');
                    return res.render('done',{data: a});
                    });
                }
                else if (password !== passwordC) {
                   // res.send("Passwords didn't match");
                    let a = "Passwords didn't match";
                    //res.send('Passwords didn't match');
                    return res.render('done',{data: a});
                }
                else {
                    //res.send("Password must not be empty");
                    let a = "Passwords must not be empty";
                    //res.send('Passwords didn't match');
                    return res.render('done',{data: a});
                }
            }
            else {
                console.log(result);
                //res.send("Username is not unique");
                let a = "Username is not unique";
                //res.send('Passwords didn't match');
                return res.render('done',{data: a});
            }
        });
});
router.get('/admin_login',(req,res) => {
    res.render('admin_login');
})
router.post('/admin_login',(req,res) => {
    let name = req.body.name;
        let password = req.body.password;
        var crypto = require('crypto');
        //console.log('hi');
       // let passwordC = req.body.passwordC;
        //console.log("select * from client_admin where name = " + db.escape(name) + " and role = 'user' ;");
        db.query("select * from client_admin where name = " + db.escape(name) + " and role = 'admin' ;",
            (error, result, field) => {
                console.log(result);
               if ( result[0] === undefined ) {
                    let a = 'Admin not registered';
                    //res.send('User not registered');
                    return res.render('done',{data: a});
                }
                else {
                    if(result[0].salt!=null)
                    console.log(result[0].salt )
                    password = result[0].salt + password;
                    const hash2 = crypto.createHash('sha256').update(password).digest('base64');

                    if (result[0] != undefined && result[0].hash == hash2) {
                        session=req.session;
                        
                        req.session.uname=req.body.name;
                         console.log(req.session);
                        //  db.query("select books.book_name from books where isbn not in (select isbn from books_user where name = " + db.escape(name) + ");",(error, result2, field) => {
                        //      console.log(result2);
                        //      db.query("select books.book_name from books inner join books_user on books.isbn = books_user.isbn where name = " + db.escape(name) + ";",(error, result3, field) => {
                        //         db.query("select books.book_name from books inner join requests on books.isbn = requests.isbn where name = " + db.escape(name) + ";",(error, result4, field) => {
                        //         let a = "Logged in";
                        //         //res.send('Passwords didn't match');
                                return res.render('admin_page',{data:result[0].name});
                            //  });
                             
                            // }); 

                         }
                             
                        
                        //console.log(bn);
                        
                    
                    else {
                        let a = "Passwords don't match";
                        return res.render('done',{data: a});
                    }
                }
                });
               // res.send('hello');
               // console.log(result[0]);
             } );
router.get('/admin_registration_approval',(req,res) => {
    db.query("select name from admin_registration ;",(error,result,field) => {
        res.render('admin_registration_approval',{data:result});
    })
})
router.post('/admin_registration_approval',(req,res) => {
    console.log('hi');
    let name = req.body.admin_reg_approval;
    console.log('helloo',name);
    db.query("select * from admin_registration where name = "+db.escape(name)+";",(error,result,field) => {
        db.query("insert into client_admin values("+db.escape(result[0].name)+", "+db.escape(result[0].hash)+", "+db.escape(result[0].salt)+", 'admin');")
        db.query("delete from admin_registration where name = "+db.escape(name)+";")
        console.log(result)
        res.render('done',{data:'doneee'});
    })
})
router.get('/add_books',(req,res) => {
    db.query("select * from books;",(error,result,field) => {
        res.render('add_books',{data3:result});
    })
});
router.post('/add_books',(req,res) => {
    let book_added = req.body.add_new_book;
    let author_name = req.body.add_author;
    db.query("select * from books where book_name = "+db.escape(book_added)+" and author = "+db.escape(book_added)+";",(error,result,field) => {
    if(result[0]==undefined){
   
    let qty = req.body.add_qty;
    const isbn = new Date();
    let isbn_val = isbn.getTime();
    console.log(isbn_val);
    db.query("insert into books values("+db.escape(isbn_val)+","+db.escape(book_added)+","+db.escape(author_name)+","+db.escape(qty)+","+db.escape(qty)+");",)
    res.render('done',{data:'Donee'})
    }
    else {
        let qty = req.body.add_qty;
        let quantity = Number(result[0].qty) + Number(qty);
        let quantity_left = Number(result[0].qty_left) + Number(qty);
        db.query("update books set qty = "+db.escape(quantity)+" where book_name= "+db.escape(book_added)+";")
        db.query("update books set qty_left = "+db.escape(quantity_left)+" where book_name= "+db.escape(book_added)+";")
        console.log(result);
    }
    res.render('done',{data:'Added!'})
})
});
router.get('/delete_books',(req,res) => {
    db.query("select * from books;",(error,result,field) => {
        res.render('delete_books',{data3:result});
    })
});
router.post('/delete_books',(req,res) => {
    let delete_book = req.body.delete_book;
    if(delete_book!==undefined){
    if(typeof delete_book == "object"){
    for(let i=0;i<delete_book.length; i++){
        db.query("select * from books where book_name = '" +delete_book[i]+ "';",(error,result,field) => {
        let isbn_val = result[0].isbn;
        db.query("delete from books where isbn = '" +isbn_val+ "';");
        db.query("delete from books_user where isbn = '" +isbn_val+ "';");
        db.query("delete from requests where isbn = '" +isbn_val+ "';");

        console.log('Deleted obj');
});
}
    }
else {
    db.query("select * from books where book_name = '" +delete_book+ "';",(error,result,field) => {
        let isbn_val = result[0].isbn;
        db.query("delete from books where isbn = '" +isbn_val+ "';");
        db.query("delete from books_user where isbn = '" +isbn_val+ "';");
        db.query("delete from requests where isbn = '" +isbn_val+ "';");
        console.log('Deleted string');
});
} }
res.render('done',{data:'Deleted'});
});
router.get('/check_in_approval',(req,res) => {
    db.query("select * from requests;",(error,result,field) => {
    res.render('check_in_approval',{data3:result})
    });
});
router.post('/check_in_approval',(req,res) => {
    let approval = req.body.check_in_approval;
    if(approval!==undefined){
                if(typeof approval == "object"){
            for(let i=0; i<approval.length;i++){
                var uname = approval[i];
                let k = uname.split(',');
                console.log("236")
                console.log(k);
                console.log(k[0]);
                console.log(k[1]);
                 db.query("delete from requests where isbn = " +db.escape(k[1])+ " and name = " +db.escape(k[0])+ ";");
                 console.log("delete from requests where book_name = " +db.escape(k[0])+ ";")
                 db.query("insert into books_user values(" +db.escape(k[1])+ "," +db.escape(k[0])+ ");");
                 console.log("update books set name="+db.escape(k[1])+" where book_name = " +k[0]+ ";");
                        console.log('Checked-in');}}
         else{
            var uname = approval;
            let k = uname.split(',');
            console.log("236")
            console.log(k);
            console.log(k[0]);
            console.log(k[1]);
            db.query("delete from requests where isbn = " +k[1]+ " and name = '" +k[0]+ "';");
            console.log("delete from requests where book_name = '" +k[0]+ "';")
            db.query("insert into books_user values(" +k[1]+ "," +k[0]+ ");");
            console.log("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
                   console.log('Checked-in');}
         }
         res.render('done',{data:'Completed check-in requests'});
        });
        router.get('/check_pending_requests',(req,res) => {
            let name = req.session.uname;
            db.query("select books.book_name from books where isbn not in (select isbn from books_user where name = " + db.escape(name) + ");",(error, result2, field) => {
                console.log(result2);
                db.query("select books.book_name from books inner join books_user on books.isbn = books_user.isbn where name = " + db.escape(name) + ";",(error, result3, field) => {
                   db.query("select books.book_name from books inner join requests on books.isbn = requests.isbn where name = " + db.escape(name) + ";",(error, result4, field) => {
                   let a = "Logged in";
                   console.log(result4);
                   //res.send('Passwords didn't match');
                   return res.render('check_pending_requests',{data: a, data2: result2, data3: result3, data4: result4});
                });
                
               }); 
            
        })
    })
    router.post('/check_pending_requests',(req,res) => {
        res.render('done',{data:"Done"});
    })
        //     var uname = book_issued;
        //         let k = uname.split(',');
        //         db.query("delete from requests where book_name = '" +k[0]+ "';");
        //         console.log("delete from requests where book_name = '" +k[0]+ "';")
        //         db.query("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
        //         console.log("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
        //         else if(k[0] ===null && k[1]!=null){
        //             db.query("delete from requests where book_name is null;");
        //          console.log("delete from requests where book_name is null;")
        //          db.query("update books set name='"+k[1]+"' where book_name is null;");
        //          console.log("update books set name='"+k[1]+"' where book_name is null;");
        //         console.log('Checked-in');
        //         }
        //         else if(k[0] !=null && k[1]===null){
        //             db.query("delete from requests where book_name = '" +k[0]+ "';");
        //             console.log("delete from requests where book_name = '" +k[0]+ "';")
        //             db.query("update books set name=null where book_name = '" +k[0]+ "';");
        //             console.log("update books set name=null where book_name = '" +k[0]+ "';");
        //            console.log('Checked-in');
        //         }
        //         else{
        //             db.query("delete from requests where book_name is null;");
        //          console.log("delete from requests where book_name is null;")
        //          db.query("update books set name=null where book_name is null;");
        //          console.log("update books set name=null where book_name is null;");
        //         console.log('Checked-in');
        //         }
        //     }
        // }

        //        else if(k[0] ===null && k[1]!=null){
        //            db.query("delete from requests where book_name is null;");
        //         console.log("delete from requests where book_name is null;")
        //         db.query("update books set name='"+k[1]+"' where book_name is null;");
        //         console.log("update books set name='"+k[1]+"' where book_name is null;");
        //        }
        //        else if(k[0] !=null && k[1]===null){
        //            db.query("delete from requests where book_name = '" +k[0]+ "';");
        //            console.log("delete from requests where book_name = '" +k[0]+ "';")
        //            db.query("update books set name=null where book_name = '" +k[0]+ "';");
        //            console.log("update books set name=null where book_name = '" +k[0]+ "';");
        //        }
        //        else{
        //            db.query("delete from requests where book_name is null;");
        //         console.log("delete from requests where book_name is null;")
        //         db.query("update books set name=null where book_name is null;");
        //         console.log("update books set name=null where book_name is null;");
        //        }
        //         console.log('Checked-in string');

//  router.get('/user2', (req,res) => {
//     let book_issued  = req.body.check_in;
//     let name = req.body.ur_book_name;
//     if(book_issued!=null){
//         if(typeof book_issued == "string"){
//     db.query("insert into requests values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
//         (error, result, field) => {
//         });
//     }
//     else{
//         for(let i=0; i<book_issued.length;i++){
//             db.query("insert into requests values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
//         (error, result, field) => {
//         });
//         }

//     }
// }
//      //res.send('Done!')
//      let a = "Done";
//      //res.send('Passwords didn't match');
//      return res.render('done',{data: a});
//  }); 
// router.get('/register', (req, res) => {
//     res.render(`register`);
// });

// router.get('/admin_login', (req, res) => {

//     res.render(`admin_login`);
// });
// router.post('/admin_login1', (req,res) => {
//     let name = req.body.name;
//     let password = req.body.password;
//     session=req.session;
//     req.session.id=req.body.name;
//     console.log(session.userid);
//     var crypto = require('crypto');
//     const hash = crypto.createHash('sha256').update(password).digest('base64');
//     db.query("select * from admin where name = " + db.escape(name) + ";",
//             (error, result, field) => {
//                if ( result[0] === undefined ) {
                    
//                    // res.send('User not registered');
//                     let a = "User not registered";
//                    //res.send('Passwords didn't match');
//                    return res.render('done',{data: a});
//                 }
//                 else {
//                     console.log(result);
//                     if (result[0] != undefined && result[0].password === hash) {
//                     db.query("select * from requests where check_r = '0';",
//                     (error, result, field) => {
//                         console.log(result);
//                     db.query("select * from requests where check_r = '1';",
//                     (error,result2, field) => {
//                         //console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX");
//                     db.query("select * from books;",
//                     (error,result3, field) => {
//                         console.log('hi');
//                     console.log(result3);
//                     return res.render('admin_login1',{data:name, data2:result, data3:result2, data4:result3});
//                     console.log(name);
//                     console.log(result);
//                     console.log(result2);
                    
//             });
//         });
// });
                    
// }
// }
// });
// });
// router.post('/admin_login2',(req, res) => {
//     var req1 = isAdmin(req, res,(req,res) => {

  
//     console.log(req);
//    /// if(admin_access==0) return res.status(403);
//     let book_issued  = req.body.check_in;
//     let check_o_book = req.body.check_out;
//     let delete_book = req.body.delete;
//     let add_new_book = req.body.add_new_book;
//     let add_author = req.body.add_author;
//     //console.log("hiiii here");
//     console.log(req.body);
//     console.log(book_issued);
//  //   console.log("217")
//     console.log(delete_book)
//     //console.log(book_issued[0].split(" "));
//     //console.log(req.body.check_in);
//     if(add_new_book!=''){
//         db.query("insert into books(book_name, author) values('"+ add_new_book +"','"+ add_author +"');");
//     }
//     if(delete_book!==undefined){
//     if(typeof delete_book == "object"){
//     for(let i=0;i<delete_book.length; i++){
//         db.query("delete from books where book_name = '" +delete_book[i]+ "';");
//         db.query("delete from requests where book_name = '" +delete_book[i]+ "';");
//         console.log('Deleted obj');
//     }
// }
// else {
//         db.query("delete from books where book_name = '" +delete_book+ "';");
//         db.query("delete from requests where book_name = '" +delete_book+ "';");
//         console.log('Deleted string');
// }
// }
//     //console.log(req.body.check_out[0]);
//     if(check_o_book!==undefined){
//     if(typeof check_o_book == "object"){
//     for(let i=0;i<check_o_book.length;i++){
//         db.query("delete from requests where book_name = '" +check_o_book[i]+ "';");
//         db.query("update books set name=null where book_name = '" +check_o_book[i]+ "';");
//         console.log('Checked-out object');
//     }
//   }
//   else {
//     db.query("delete from books where book_name = '" +check_o_book+ "';");
//         db.query("delete from requests where book_name = '" +check_o_book+ "';");
//         console.log('Checked-out string');
// }
// }
//     if(book_issued!==undefined){
//         if(typeof book_issued == "object"){
//     for(let i=0; i<book_issued.length;i++){
//         var uname = book_issued[i];
//         let k = uname.split(',');
//      //   console.log("236")
//         console.log(k);
//         console.log(k[0]);
//         console.log(k[1]);
//         if(k[0]!=null && k[1]!=null){
//          db.query("delete from requests where book_name = '" +k[0]+ "';");
//          console.log("delete from requests where book_name = '" +k[0]+ "';")
//          db.query("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
//          console.log("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
//         console.log('Checked-in');
//         }
//         else if(k[0] ===null && k[1]!=null){
//             db.query("delete from requests where book_name is null;");
//          console.log("delete from requests where book_name is null;")
//          db.query("update books set name='"+k[1]+"' where book_name is null;");
//          console.log("update books set name='"+k[1]+"' where book_name is null;");
//         console.log('Checked-in');
//         }
//         else if(k[0] !=null && k[1]===null){
//             db.query("delete from requests where book_name = '" +k[0]+ "';");
//             console.log("delete from requests where book_name = '" +k[0]+ "';")
//             db.query("update books set name=null where book_name = '" +k[0]+ "';");
//             console.log("update books set name=null where book_name = '" +k[0]+ "';");
//            console.log('Checked-in');
//         }
//         else{
//             db.query("delete from requests where book_name is null;");
//          console.log("delete from requests where book_name is null;")
//          db.query("update books set name=null where book_name is null;");
//          console.log("update books set name=null where book_name is null;");
//         console.log('Checked-in');
//         }
//     }
// }
// else{
//     var uname = book_issued;
//         let k = uname.split(',');
//     if(k[0]!=null && k[1]!=null){
//         db.query("delete from requests where book_name = '" +k[0]+ "';");
//         console.log("delete from requests where book_name = '" +k[0]+ "';")
//         db.query("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
//         console.log("update books set name='"+k[1]+"' where book_name = '" +k[0]+ "';");
//        }
//        else if(k[0] ===null && k[1]!=null){
//            db.query("delete from requests where book_name is null;");
//         console.log("delete from requests where book_name is null;")
//         db.query("update books set name='"+k[1]+"' where book_name is null;");
//         console.log("update books set name='"+k[1]+"' where book_name is null;");
//        }
//        else if(k[0] !=null && k[1]===null){
//            db.query("delete from requests where book_name = '" +k[0]+ "';");
//            console.log("delete from requests where book_name = '" +k[0]+ "';")
//            db.query("update books set name=null where book_name = '" +k[0]+ "';");
//            console.log("update books set name=null where book_name = '" +k[0]+ "';");
//        }
//        else{
//            db.query("delete from requests where book_name is null;");
//         console.log("delete from requests where book_name is null;")
//         db.query("update books set name=null where book_name is null;");
//         console.log("update books set name=null where book_name is null;");
//        }
//         console.log('Checked-in string');
// }
// }
//     //db.query("delete from aaaa where ")
    
//     let a = "Done";
//     //res.send('Passwords didn't match');
//     return res.render('done',{data: a});
// });
// }
// );
// router.get('/done', (req, res) => {
//     delete req.session;
//     session = null;
//     return res.redirect('http://localhost:8200/');
//     // req.session.destroy();
//     // res.render('index');
// });

// function isAdmin (req,res,next) {
//     db.query('select * from admin where name ="'+req.session.id+'";',
//     (error,result,fields) => {
//         console.log("Isadmin");
//         if(session ==  null || result == undefined){
//             res.status(403).send({ 'msg': 'Not Authenticated'});
//             return 0;
//         }
//         else{
//             //return req;
//             next(req,res);
//         }

//     })
  
// }
    //if(book_issued != null && check_o_book!=null){
        //         console.log(book_issued);
        //         if(book_issued!=null){
        //         if(typeof book_issued == "string"){
        //     db.query("insert into requests values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
        //         (error, result, field) => {
        //         });
        //     }
        //     else{
        //         for(let i=0; i<book_issued.length;i++){
        //             db.query("insert into requests values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
        //         (error, result, field) => {
        //         });
        //         }
        
        //     }

// router.post('/user', (req, res) => {
//     console.log("hiiii");
//     console.log(req.body);
//     console.log(req.body.check_in);
//     console.log(req.body.check_out);
//     let book_issued  = req.body.check_in;
//     let name = req.body.ur_book_name;
//     let check_o_book = req.body.check_out;
//     // if(book_issued != null && check_o_book!=null){
//         console.log(book_issued);
//         if(book_issued!=null){
//         if(typeof book_issued == "string"){
//     db.query("insert into requests values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
//         (error, result, field) => {
//         });
//     }
//     else{
//         for(let i=0; i<book_issued.length;i++){
//             db.query("insert into requests values (" + db.escape(book_issued) + ", " + db.escape(name) + ", '0' );",
//         (error, result, field) => {
//         });
//         }

//     }
// }
// if(check_o_book!=null){
//     if(typeof check_o_book == "string"){
// db.query("insert into requests values (" + db.escape(check_o_book) + ", " + db.escape(name) + ", '1' );",
//     (error, result, field) => {
//     });
// }
// else{
//     for(let i=0; i<book_issued.length;i++){
//         db.query("insert into requests values (" + db.escape(check_o_book) + ", " + db.escape(name) + ", '1' );",
//     (error, result, field) => {
//     });
//     }

// }
// }
// //     else{

// //     }
// // }
// //     else{
// //         res.send('No changes done');
// //     }
// //res.send('Done')
// let a = 'Done';
// //res.send('User not registered');
// return res.render('done',{data: a});
// });