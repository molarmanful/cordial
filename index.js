d=require('discord.js')
t=require('terminal-kit').terminal
mk=require('marked')
mt=require('marked-terminal')
mk.setOptions({
  renderer:new mt()
})

C=new d.Client()
l=console.log
T=x=>l('\033]0;'+x+'\007')
M=x=>{
  t.colorRgb(...s.rolesOf(x.author).reverse()[0].colorAsHex().slice(1).match(/../g).map(x=>+`0x${x}`))(x.author.name)(`\t^:^-${Date(x.timestamp)} | ID#${x.id}^:\n${mk(x.cleanContent)}`)
  x.attachments.length&&(t(`^/${x.attachments.length} ATTACHED\n`),x.attachments.map(x=>t(`^g - ${x.url}\n`)))
  t('\n^-——————————\n\n')
}
s=0
t.grabInput({mouse:'button'})

//login
login=_=>{
  t.clear()
  T('Login')
  t.cyan.bold('LOGIN\n')
  _&&t.brightRed('Login failed, please try again.\n')
  t('Email  ')
  t.inputField({},(_,x)=>{
    t('\n\nPassword  ')
    t.inputField({echo:false},(_,y)=>{
      t.clear()
      t('Logging in...')
      C.login(x,y,e=>{
        e&&login(1)
      })
    })
  })
}
require('fs').readFile(__dirname+'/creds.json','utf8',(x,y)=>{
  x||process.argv[2]?login():(y=JSON.parse(y),t.clear(),t('Logging in...'),C.login(y.email,y.pass,e=>e&&login(1)))
})

//server
server=_=>{
  t.clear()
  T('Join')
  t.cyan.bold('SERVERS\n')
  t.singleLineMenu(['PRIVATE CHANNELS'].concat(Array.from(C.servers).map((x,y)=>x.name)),{selected:t.yellow.bgcyan},(_,x)=>{
    x.selectedIndex?channel(x.selectedIndex-1):pmchannel()
  })
}

//server channel
channel=x=>{
  s=C.servers[x]
  t.cyan.bold('\n\nCHANNELS\n')
  t.singleLineMenu(Array.from(s.channels).filter(x=>x.type=='text'&&(x.permissionsOf(C.user).hasPermission('administrator')||x.permissionsOf(C.user).hasPermission('readMessages'))).map((x,y)=>x.name),{selected:t.yellow.bgcyan},(_,x)=>{
    messages(x.selectedIndex)
  })
}

//pm channels
pmchannel=_=>{
  t.cyan.bold('\n\nPRIVATE CHANNELS\n')
  t.singleLineMenu(Array.from(C.privateChannels).map((x,y)=>`@${x.recipient.name}#`+x.recipient.discriminator),{selected:t.yellow.bgcyan},(_,x)=>{
    pmessages(x.selectedIndex)
  })
}

//messages
messages=x=>{
  t.clear()
  c=s.channels.filter(x=>x.type=='text'&&(x.permissionsOf(C.user).hasPermission('administrator')||x.permissionsOf(C.user).hasPermission('readMessages')))[x]
  T('#'+c.name)
  //message history
  c.getLogs(100,{},(x,y)=>{
    y.reverse().map(M)
  })
  //onmessage
  C.on('message',m=>{
    m.server.id==s.id&&m.channel.id==c.id&&M(m)
  })
  //message updated -> reset log
  C.on('messageDeleted',x=>messages(x))
  C.on('messageUpdated',x=>messages(x))
}

pmessages=x=>{
  t.clear()
  c=C.privateChannels[x]
  T(`@${c.recipient.name}#`+c.recipient.discriminator)
  //message history
  c.getLogs(100,{},(x,y)=>{
    y.reverse().map(M)
  })
  //onmessage
  C.on('message',m=>{
    m.channel.id==c.id&&M(m)
  })
  //message updated -> reset log
  C.on('messageDeleted',x=>pmessages(x))
  C.on('messageUpdated',x=>pmessages(x))
}

//logged in
C.on('ready',_=>{
  server()
})

//quit
t.on('key',x=>{
  x=='CTRL_C'&&(T('_'),t.clear(),t.processExit(0))
})
