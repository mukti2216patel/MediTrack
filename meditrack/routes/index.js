var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/register' , (req , res)=>{
  res.render('register');
})

router.post('/register' , async(req , res)=>{
    let {name , type , address , conatctnum , email , adminname , licensenum , yearofestablishment } = req.body;
    
})
module.exports = router;
