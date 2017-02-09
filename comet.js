const discord = require('discord.js');
const client = new discord.Client();
const config = require('./config.json');
const webapp = require('firebase');
const math = require('mathjs');
const fbConfig = require('./fbConfig.json');
var help = require('./help.json');
var cleverbot = require('cleverbot-node');
var urban = require('urban');
var cvbot = new cleverbot();
var api = webapp.initializeApp(fbConfig);
var db = api.database();
const prefix = "c@";
var recheck = false;
var hasJoined = false;

var helpEmbed = new discord.RichEmbed();
helpEmbed.addField("Creator Commands","kill, oauth, update, purge, announce, nuke, run",false);
helpEmbed.addField("Server Commands","setup, config, admin",false);
helpEmbed.addField("User Commands","help, about, info, guilds, reaction, poll, urban",false);
helpEmbed.addField("Allowed Modules","NodeJS, DiscordJS, MathJS, Firebase, Cleverbot, Urban",false);
helpEmbed.setColor("#008080");

var aboutEmbed = new discord.RichEmbed()
aboutEmbed.addField("Bot Name","Comet",true);
aboutEmbed.addField("Bot Version","1.5.3",true);
aboutEmbed.addField("Bot Library","Discord.JS",true);
aboutEmbed.setColor("#008080");


client.on("ready", () => {
  if(!recheck) {
    console.log("Comet -> Discord Client Initialized");
    aboutEmbed.addField("Bot ID",client.user.id,true);
    aboutEmbed.setThumbnail(client.user.avatarURL);
    aboutEmbed.addField("Cached Users",client.users.array().length,true);
    aboutEmbed.addField("Cached Guilds",client.guilds.array().length,true);
    aboutEmbed.addField("Shard Id",client.shard.id + " / " + client.shard.count,true);
    aboutEmbed.addField("Bot Author","Pyxel#4687",true);
    recheck = true;
    client.user.setGame("c@help");
    for(var i = 0; i < client.users.array().length; i++) {
      db.ref("users/" + client.users.array()[i].id).set({
        username : client.users.array()[i].username,
        discriminator : client.users.array()[i].discriminator,
        avatar : client.users.array()[i].avatar,
        lastMessage : client.users.array()[i].lastMessageID
      });
    }
    console.log("Comet -> Updated User Database");
  }
});

client.on("message", msg => {
  var mbr = msg.guild.member(msg.author.id);
  if(mbr.roles.find("name","comet-mute")){
    msg.delete(0);
  }
  if(!msg.author.bot) {
    if(!config["chBlacklist"].indexOf(msg.channel.id) > -1) {
      db.ref("messages/" + msg.id).set({
        author : msg.author.id,
        timestamp : msg.createdTimestamp,
        content: msg.content
      });
    }
  }
  var token = msg.content.split(" -");
  if(config['whitelist'].indexOf(msg.author.id) > -1) {
    switch(token[0]) {
      case prefix + "kill":
        client.destroy();
        process.exit(0);
        break;
      case prefix + "oauth":
        msg.channel.sendMessage("https://discordapp.com/api/oauth2/authorize?client_id=276401356888080385&scope=bot");
        break;
      case prefix + "update":
        for(var i = 0; i < client.users.array().length; i++) {
          db.ref("users/" + client.users.array()[i].id).set({
            username : client.users.array()[i].username,
            discriminator : client.users.array()[i].discriminator,
            avatar : client.users.array()[i].avatar,
            lastMessage : client.users.array()[i].lastMessageID
          });
        }
        console.log("Comet -> Updated User Database");
        msg.channel.sendMessage("**Force updated the user database!**");
        break;
      case prefix + "purge":
        var sel = token[1];
        db.ref(sel).remove().then(function() {
          msg.channel.sendMessage("**Purged Data** " + sel + " **From The Database**!");
          console.log("Comet -> Purged Data " + sel);
        });
        break;
      case prefix + "announce":
        for(var i = 0; i < client.guilds.array().length; i++) {
          var guild = client.guilds.get(client.guilds.array()[i].id);
          guild.defaultChannel.sendMessage(token[1]);
        }
        break;
      case prefix + "nuke":
        msg.channel.sendMessage("**Now Nuking Messages**");
        if(token[1]){
          var count = client.sweepMessages(parseInt(token[1]));
          msg.channel.sendMessage("Removed **" + count + "** message(s)!");
        } else {
          var count = client.sweepMessages();
          msg.channel.sendMessage("Removed **" + count + "** message(s)!");
        }
        break;
      case prefix + "run":
        var output = eval(token[1]);
        var runEmbed = new discord.RichEmbed();
        runEmbed.setColor("#008080");
        runEmbed.addField("Command",token[1],false);
        runEmbed.addField("Output",output,false);
        msg.channel.sendEmbed(runEmbed);
        runEmbed = null;
    }
  }
  switch(token[0]){
    case prefix + "help":
      if(!token[1]) {
        msg.channel.sendEmbed(helpEmbed);
      } else {
        if(help[token[1]]) {
          var cmdEmbed = new discord.RichEmbed();
          cmdEmbed.setColor("#008080");
          cmdEmbed.addField("Name",token[1],false);
          cmdEmbed.addField("Description",help[token[1]]['description'],false);
          cmdEmbed.addField("Usage",help[token[1]]['example'],false);
          msg.channel.sendEmbed(cmdEmbed);
          cmdEmbed = null;
        } else {
          msg.channel.sendMessage("**Invalid Or Undefined Command!**");
        }
      }
      break;
    case prefix + "about":
      msg.channel.sendEmbed(aboutEmbed);
      break;
    case prefix + "info":
      if(token[1]) {
        var user = client.users.find("username",token[1]);
        var infoEmbed = new discord.RichEmbed();
        infoEmbed.setColor("#008080");
        infoEmbed.addField("Username",user.username,true);
        infoEmbed.addField("Discriminator",user.discriminator,true);
        infoEmbed.addField("CreationID",Math.round(user.createdTimestamp),true);
        infoEmbed.addField("UserUID",user.id,true);
        infoEmbed.addField("Status",user.presence.status,true);
        if(user.presence.game) {
          infoEmbed.addField("Game",user.presence.game.name,true);
        } else {
          infoEmbed.addField("Game","none",true);
        }
        infoEmbed.addField("AvatarURL",user.avatarURL,true);
        infoEmbed.setThumbnail(user.avatarURL);
        msg.channel.sendEmbed(infoEmbed);
        infoEmbed = null;
      } else {
        var infoEmbed = new discord.RichEmbed();
        infoEmbed.setColor("#008080");
        infoEmbed.addField("Username",msg.author.username,true);
        infoEmbed.addField("Discriminator",msg.author.discriminator,true);
        infoEmbed.addField("CreationID",Math.round(msg.author.createdTimestamp),true);
        infoEmbed.addField("UserUID",msg.author.id,true);
        infoEmbed.addField("Status",msg.author.presence.status,true);
        if(msg.author.presence.game) {
          infoEmbed.addField("Game",msg.author.presence.game.name,true);
        } else {
          infoEmbed.addField("Game","none",true);
        }
        infoEmbed.addField("AvatarURL",msg.author.avatarURL,true);
        infoEmbed.setThumbnail(msg.author.avatarURL);
        msg.channel.sendEmbed(infoEmbed);
        infoEmbed = null;
      }
      break;
    case prefix + "guilds":
      var guildsEmbed = new discord.RichEmbed();
      guildsEmbed.setColor("#008080");
      for(var i = 0; i < client.guilds.array().length; i++) {
        guildsEmbed.addField(client.guilds.array()[i].name,client.guilds.array()[i].memberCount + " Users",true);
      }
      msg.channel.sendEmbed(guildsEmbed);
      guildsEmbed = null;
      break;
    case prefix + "reaction":
      db.ref("reactions/" + token[1]).set({
        reply : token[2],
        creator : msg.author.id
      }).then(msg.channel.sendMessage("Added Reaction **" + token[1] + "** with reply **" + token[2] + "**!"));
      break;
    case prefix + "poll":
      msg.channel.sendMessage(msg.author.username + " asks: **" + token[1] + "**").then(function(mesg){
        mesg.react("❎");
        mesg.react("✅");
      });
      break;
    case prefix + "urban":
      var request = urban(token[1]);
      request.first(function(json){
        if(json){
          var urbanEmbed = new discord.RichEmbed();
          urbanEmbed.setColor("#008080");
          urbanEmbed.addField("Word",json['word'],false);
          urbanEmbed.addField("Definition",json['definition'],false);
          if(json['example']){
            urbanEmbed.addField("Example",json['example'],false);
          } else {
            urbanEmbed.addField("Example","no example given",false);
          }
          urbanEmbed.setFooter("Word Added By " + json['author']);
          msg.channel.sendEmbed(urbanEmbed);
          urbanEmbed = null;
        } else {
          msg.channel.sendMessage("**Word Not Found!**");
        }
      });
      break;
    case prefix + "setup":
      if(msg.author.id == msg.guild.ownerID){
        db.ref('servers/' + msg.guild.id).set({
          creator : msg.guild.ownerID,
          admins : [msg.guild.ownerID],
          welcome : "welcome to " + msg.guild.name + "!"
        }).then(function(){
          msg.channel.sendMessage("Setup Your Server!");
        });
      } else {
        msg.channel.sendMessage("**You Are Not The Guild Creator!**");
      }
      break;
    case prefix + "config":
      db.ref('servers').child(msg.guild.id).once('value', function(snapshot){
        if(snapshot.val() !== null){
          if(snapshot.val().admins.indexOf(msg.author.id) > -1) {
            var updates = {};
            updates["/servers/" + msg.guild.id + "/" + token[1]] = token[2];
            db.ref().update(updates);
            updates = {};
            msg.channel.sendMessage("**Updated Value** " + token[1] + " **To** \"" + token[2] +"\"");
          } else {
            msg.channel.sendMessage("**You Are Not A Guild Admin!**");
          }
        } else {
          msg.channel.sendMessage("**Please Ask The Guild Owner To Run c@setup!**");
        }
      });
      break;
    case prefix + "admin":
      db.ref('servers').child(msg.guild.id).once('value', function(snapshot){
        if(snapshot.val() !== null){
          if(snapshot.val().admins.indexOf(msg.author.id) > -1) {
            switch(token[1]){
              case "add":
                var cAdmins = snapshot.val().admins;
                cAdmins.push(token[2]);
                var updates = {};
                updates["/servers/" + msg.guild.id + "/admins"] = cAdmins;
                db.ref().update(updates);
                updates = {};
                msg.channel.sendMessage("Added Admin!");
                break;
              case "remove":
                db.ref("/servers/" + msg.guild.id + "/admins/" + snapshot.val().admins.indexOf(token[2])).remove();
                msg.channel.sendMessage("Removed Admin!");
                break;
            }
          } else {
            msg.channel.sendMessage("**You Are Not A Guild Admin!**");
          }
        } else {
          msg.channel.sendMessage("**Please Ask The Guild Owner To Run c@setup!**");
        }
      });
      break;
  }

  if(!msg.author.bot) {
    var reactions = db.ref('reactions');
    var invString = false;
    var invalid = ['<','>','[',']','#','$','%','.','^','&','*','(',')'];
    for(var i = 0; i < invalid.length; i++){
      if(msg.content.includes(invalid[i])){
        invString = true;
      }
    }
    if(!msg.attachments){
      invString = true;
    }
    if(!invString){
      reactions.child(msg.content).once('value', function(snapshot){
        if(snapshot.val() !== null) {
          db.ref("reactions/" + msg.content).once('value').then(function(snapshot){
            msg.channel.sendMessage(snapshot.val().reply);
          }).catch(function(reason) {
          });
        }
      });
    }
  }
  if(msg.isMentioned("276401356888080385")){
    var message = msg.content;
    cleverbot.prepare(function() {
      cvbot.write(message, function(reply){
        msg.channel.sendMessage(reply.message);
      });
    });
  }
});

client.on('guildMemberAdd', member => {
  db.ref('servers').child(member.guild.id).once('value', function(snapshot){
    if(snapshot.val() !== null){
      member.guild.defaultChannel.sendMessage(member.user.username + ", " + snapshot.val().welcome);
    }
  });
});

client.login(config['token']);
