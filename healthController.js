function getHealth(req,res){
  res.status(200).json({status:"ok",project:"Findly Campus",phase:2});
}
module.exports={getHealth};
