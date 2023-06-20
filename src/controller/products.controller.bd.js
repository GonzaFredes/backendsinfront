const Products = require("../dao/mongoManager/BdProductManager");
const CustomError = require("../errors/customError");
const { ProductRepository } = require("../service/index.repository");
const { invalidParamsProduct, invalidId } = require("../utils/creatorMsg");
const {ERROR_FROM_SERVER, INVALID_FILTER} = require ("../errors/enumErrors");
const mailingService = require("../service/mailing.service");

const getProductsBd = async (req, res) => {
  const {limit, page,sort, ...query} = req.query;
       const products = await ProductRepository.get (page,limit,sort,query);
       const {docs, ...resto} = products;
       const state =  products ? "success" : "error";
       if (products){
          res.json({...resto, status:state, payload:docs})      
       }else{
        res.json(products)
       }
};

const addProductBd = async (req, res, next) => {
  const product = req.body;
  if (req.user.role !== 'user'){
    product.owner = req.user.email;
    product.ownerRole = req.user.role;
    const newproduct = await ProductRepository.add(product);
    return res.json(newproduct);
  } else {
    return res.json({
      msg: 'Este usuario no puede agregar productos',
    })
  }
}

const getProductIdBd = async (req, res, next)=>{
  const id = req.params.pid 
  const getProductId = await ProductRepository.getId(id);
  if (getProductId){
    res.json(getProductId)      
  }else{
    res.json(getProductId)
  }
}

const UpdateProductBd = async (req, res)=>{
  const id = req.params.pid 
  const product = req.body
  const UpdateProductId = await Products.UpdateProduct(id, product);
  if (UpdateProductId){
     res.json(UpdateProductId)      
  }else{
    res.json(UpdateProductId)  
  }
}

const deleteProductBd = async (req, res)=>{
  const id = req.params.pid;
  const productExist = await Products.getProductId(id);
  if (!productExist) {
    return res.json({ msg: 'Producto Inexistente' });
  }
  if (req.user.role === 'admin') {
    await Products.DeleteProductId(id);
    const propietario = productExist.ownerRole;
    if (propietario === 'premium') {
      mailingService.sendMail({
        to: productExist.owner,
        subject: "Se ha eliminado tu producto de Pragon Store",
        html: `<div style="background-color: black; color: green; display: flex; flex-direction: column; justify-content: center;  align-items: center;">
                <h1>Tu producto (${productExist.title}) ha sido eliminado!</h1>
                <div><img src="${productExist.thumbnail}"></div>
                </div>`,
      });
    }
    return res.json({ msg: 'Producto Eliminado' });
  }
  if (req.user.role === 'premium') {
    if (req.user.email == productExist.owner) {
      await Products.DeleteProductId(id);
      if (productExist.owner){
        mailingService.sendMail({
          to: req.user.email,
          subject: "Se ha eliminado tu producto de Pragon Store",
          html: `<div style="background-color: black; color: green; display: flex; flex-direction: column; justify-content: center;  align-items: center;">
                  <h1>Tu producto (${productExist.title}) ha sido eliminado!</h1>
                  <div><img src="${productExist.thumbnail}"></div>
                  </div>`,
        });
      }
      return res.json({ msg: 'Producto Eliminado' });
    } else {
      return res.json({ msg: 'No tienes permisos para eliminar este producto' });
    }
  } else {
    return res.json({ msg: 'No tienes permisos para eliminar este producto' });
  }
}

module.exports ={
    getProductsBd, 
    getProductIdBd,    
    addProductBd,
    UpdateProductBd,     
    deleteProductBd,
}
