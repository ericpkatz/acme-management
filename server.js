const Sequelize = require('sequelize');
const { STRING } = Sequelize.DataTypes;

const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_management_db');

const Employee = conn.define('employee', {
  name: STRING 
});

Employee.prototype.managementChain = async function(){
  let managerId = this.managerId;
  const chain = [];
  while(managerId !== null){
    const manager = await Employee.findByPk(managerId);
    chain.push(manager);
    managerId = manager.managerId;
  }
  chain.reverse();
  return chain;
}
Employee.belongsTo(Employee, { as: 'manager' });
Employee.hasMany(Employee, { as: 'manages', foreignKey: 'managerId' });

/*
 * lucy
 *   - moe
 *     - curly
 *       - brian
 *   - larry
 */

const syncAndSeed = async()=> {
  await conn.sync({ force: true });
  const [moe, larry, lucy, curly, brian] = await Promise.all(
    ['moe', 'larry', 'lucy', 'curly', 'brian'].map( name => {
      return Employee.create({ name });
    })
  );

  await Promise.all([
    //lucy.setManages([moe, larry]),
    moe.setManager(lucy),
    larry.setManager(lucy),
    curly.setManager(moe),
    brian.setManager(curly)
  ]);

  const managementChain = await brian.managementChain();
  managementChain.forEach( employee => console.log(employee.name));

  /*
  moe.managerId = lucy.id;
  console.log(moe.managerId);
  await moe.save();
  */
};


syncAndSeed();
