import {MongoClient} from 'mongodb';

async function main() {
  console.log("Undeploying all contracts");
  const uri = process.env.MONGODB_URI;
  // @ts-ignore
  const client = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});
  await client.connect();

  // TODO should we create a backup of what is being undeployed?
  //  ... set active to false and change name to not conflict with unique index
  // TODO filter what will be undeployed
  await client.db('indexpool').collection('contracts').deleteMany({});
  console.log("Undeploy is done :D");
}

main()
.then(() => process.exit(0))
.catch(error => {
  console.error(error);
  process.exit(1);
});
