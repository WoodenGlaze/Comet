const discord = require('discord.js');

const sharder = new discord.ShardingManager(`${process.cwd()}/comet.js`, {
  totalShards : "auto",
  respawn : true
});

sharder.on('launch', shard => console.log('Comet -> Launched Shard #' + shard.id));

sharder.spawn(5);
