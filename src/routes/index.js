const {Router} = require('express');
const router = Router();

const moment = require('moment');

const path = require('path');
//Se debe importar este path para poder trabajar con rutas del sistema
//y se usa con unlink en este modulo.
const {unlink} = require('fs-extra');
//Unlink sirve para eliminar la imagen tambien del folder Uploads

//Esta constante image es la que me permite crear una nueva
//imagen y guardarla en la base de datos
const Image = require('../models/Image');
const RegistroMercado = require('../models/RegistroMercado');

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


router.get('/', async(req,res)=>{
    const images = await Image.find();
    //console.log(images);
    res.render('index', {images: images});
});


router.get('/costco', async(req,res)=>{
    const images = await Image.find();
    res.render('costco', {images: images});
});

router.get('/superstore', async(req,res)=>{
    const images = await Image.find();
    res.render('superstore', {images: images});
});

// router.get('/coop', async(req,res)=>{
//     const images = await Image.find();
//     res.render('coop', {images: images});
// });



router.get('/upload', (req,res)=>{
    res.render('upload.ejs');
});



router.post('/upload', async(req,res)=>{
    const image = new Image();
    //el req.body es lo que se recibe desde el formulario
    console.log('Esto es el req de Image: ' + req);
    const result = await cloudinary.v2.uploader.upload(req.file.path);
        image.title = req.body.title;
        image.description = req.body.description;
        image.filename = req.file.filename;
        //image.path = 'img/uploads/' + req.file.filename;
        image.path = result.url;
        image.public_id = result.public_id;
        image.originalname = req.file.originalname;
        image.mimetype = req.file.mimetype;
        image.size = req.file.size;
        image.portada = req.body.portada;
        image.precio = req.body.precio;
        image.adicionar = req.body.adicionar;
        image.veces = req.body.veces;
    //await unlink(path.resolve('./src/public/' + image.path));
    await unlink(req.file.path);
    await image.save();
    //console.log(image);
    res.redirect('/');
});


router.post('/history', async(req,res)=>{
    const registroMercado = new RegistroMercado();
    registroMercado.valor = req.body.valor;
    registroMercado.fecha = moment().format('LL'); 
    registroMercado.hora = moment().format('LTS');
    registroMercado.mesa = req.body.mesa;
    await registroMercado.save();
    res.redirect('/clear');
});

router.get('/history', async(req,res)=>{
    const registrosMercado = await RegistroMercado.find();
    console.log(registrosMercado);
    res.render('history', {registrosMercado});
});



router.get('/image/:id', async(req,res)=>{
    const {id} = req.params;
    console.log('El id de la foto es: ' + id);
    const image = await Image.findById(id);
    const images = await Image.find();
    console.log('Esto es image: ' + image);
    // res.render('profile', {image: image});
    if (image.description == 'Almuerzos'){
        res.render('almuerzos', {image: image,images: images});
    }else{
        res.render('profile', {image: image});
    }
});


router.get('/image/:id/delete', async(req,res)=>{
    console.log(req.params.id);
    const {id} = req.params;
    const image = await Image.findByIdAndDelete(id);
            //Esto (arriba) elimina la imagen (ruta) de la base de datos,
            //y los datos se guardan en la constante image
    //await unlink(path.resolve('./src/public/' + image.path));
            //y esto elimina la imagen de uploads usando las propiedades de image.
    await cloudinary.v2.uploader.destroy(image.public_id);
            //Este es para borrar la imagen de Cloudinary
    res.redirect('/');
});


router.get('/registro/:id/delete', async(req,res)=>{
    //console.log(req.params.id);
    const {id} = req.params;
    const registroMercado = await RegistroMercado.findByIdAndDelete(id);
    res.redirect('/history');
});


router.get('/image/:id/add', async(req,res)=>{
    //console.log(req.params.id);
    const {id} = req.params;
    const image = await Image.findById(id);
    let veces = image.veces;
    veces = veces + 1;
    //console.log("veces: "+veces);
    await Image.findByIdAndUpdate(id, { adicionar: "ON", veces });
    //console.log(image);
    res.redirect('/');
});


router.get('/image/:id/remove', async(req,res)=>{
    //console.log(req.params.id);
    const {id} = req.params;
    const image = await Image.findById(id);
    let veces = image.veces;
    veces = veces - 1;
    //console.log("veces: "+veces);
    await Image.findByIdAndUpdate(id, { adicionar: "OFF", veces});
    //console.log(image);
    res.redirect('/');
});

router.get('/clear', async(req,res)=>{
    const images = await Image.find();
    images.forEach(imagen => {
        clearOrden(Image, imagen);
    });
    res.redirect('/');
});
async function clearOrden(Image,imagen){
    await Image.findByIdAndUpdate(imagen.id, { veces: 0 });
};


module.exports = router;