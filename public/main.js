$("button").click(function(){
  console.log("this click work")
})

var TimemodelApp = {
  Models: {},
  Collections: {},
  Views: {},
  Templates: {}
};

TimemodelApp.Models.Timemodel = Backbone.Model.extend({
  defaults: {
  
  },
  initialize: function(){

  }
});

TimemodelApp.Models.Application = Backbone.Model.extend({
  defaults: {
  
  },
  initialize: function(){

  }
});

TimemodelApp.Models.Node = Backbone.Model.extend({
  defaults: {
  },
  initialize: function(){

  }
});

var TimemodelCollection = Backbone.Collection.extend({
  model: TimemodelApp.Models.Timemodel,
  url: "/api/timemodel"
});

var NodesCollection = Backbone.Collection.extend({
  initialize: function(models, options){
    this.id = options.id
  },
  model: TimemodelApp.Models.Node,
  url: function(){
    return '/api/timemodel/' + this.id + '/nodes'
  }
})

var ApplicationCollection = Backbone.Collection.extend({
  initialize: function(models, options){
  },
  model: TimemodelApp.Models.Application,
  url: function(){
    return '/api/application'
  }
})

var ConnectedNodesCollection = Backbone.Collection.extend({
  initialize: function(models, options){
    this.id = options.id
    this.node_name = options.node_name
  },
  model: TimemodelApp.Models.Node,
  url: function(){
    return '/api/timemodel/' + this.id + '/node/' + this.node_name
  }
})

var TimemodelView1 = Backbone.View.extend({
  el: $('html'),
  events: {
    'click #server-container .list-group .nodeButton': 'nodeButtonClick',
    'click #server-container .list-group .appButton': 'appButtonClick',
    'click .serverView':'serverContainerClick',
    'click .clear': 'clear',
    'click .removeSingleNodes' : 'removeSingles'
  },
  initialize: function(){
    _.bindAll(this, 'render')
    this.render();
  },
  render: function(){
    fetch.done(function(){

      main_collection.forEach(function(model){
        $(this.el).append("This is the time " + model.get('time'));
        $('#time-container .list-group').append("<a href='#' class='list-group-item' class='test_button' data-id='" + model.get('_id') + "'>" + model.get('time') + "</a>")
      })

      $('#timemodel-container').html($(this.el).html());

      click(main_collection.models[0].get('_id'), main_collection.models[0].get('time'))
    })

    var self = this;
    var length = main_collection.length

    console.log(jQuery.ui.version)

    $(function(){
      $("#slider-horizontal").slider({
        orientation: 'horizontal',
        range: 'min',
        min: 0,
        max: 100,
        slide: self.updateSlider
      });
    })

  },
  removeSingles: function(){
    removeSingleNodes();
  },
  clear: function(){
  
    for(var i = nodes.length - 1; i >= 0; i--){
      remove(nodes[i].name)
    }

    removeSelected();
    restart();
  },
  updateSlider: function(event, ui){

    console.log(nodes.length)

    if(nodes.length != 0){
      if(confirm("Changing the time will reset your nodes. Is this ok?")){
        nodes = []
        links = []
        console.log("nodes is now empty. proof:")
        console.log(nodes.length)

        restart();

        update();
      }
      else{
        console.log("nothing happened")
        $("#slider-vertical a").removeClass("ui-state-focus ui-state-active ui-state-hover")
        console.log($("#slider-vertical a").attr("class"))
      }
    }    
    else{
      update();
    }

    function update(){
      var i = (ui.value/100)*main_collection.length
      i = Math.ceil(i)

      var currentModel = main_collection.models[i]
      click(currentModel.get("_id"), currentModel.get("time"))
    }

  },

  // Will toggle if the button has been selected or not
  // If selected, will delect and remove node
  // If not selected, will select, add node, fetch it's connections
  // and add it's connections
  nodeButtonClick: function(e){
    current = $(e.currentTarget)

    console.log("node button was clicked")

    var time_id = current.data("timeid") // get id of current button
    var name = current.data("name") //get current hostname

    //toggle selected
    current.toggleClass('selected');

    //if the node has been selected
    if(current.hasClass('selected') == true){
    	findAddEdges(time_id, name)
    }
    // if the node is not selected
    else{
      remove(name)
      restart();
    };
  },
  appButtonClick: function(e){

    current = $(e.currentTarget)

    current.toggleClass('selected');


    applicationName = current.data("name")

    var serverArray;
    var array = new Array();

    applicationCollection.forEach(function(application){
      if(application.get("name") == applicationName){
        // console.log(application.get("server_ids"))
        serverArray = application.get("server_ids")
      }
    })

    serverArray.forEach(function(d, index){

    	console.log("this is the d");
    	console.log(d);

    	var current = nodesCollection.where({server_id: d})
      if(current.length > 0)
        array[index] = current[0].get("hostname");
    })
    addApp(applicationName, array)
  },
  serverContainerClick: function(){

  }
});


function click(e, f){
  var collectionID = e;

  nodesCollection = new NodesCollection([], {id: collectionID});
  getNodes = nodesCollection.fetch();

  getNodes.done(function(){

    $('#server-container .list-group li').remove()

    nodesCollection.forEach(function(node){
      $(this.el).append("This is the hostname " + node.get('hostname'));
      $('#server-container .list-group').append("<li><a href='#' class='list-group-item nodeButton' data-name='"+ node.get('hostname') + "' data-timeid='" + node.get('timemodel_id') + "'>" + node.get('hostname') + "</a></li>");
    });
  
    var currentTime = new Date(1000*f);

    $('.time').text("Time: " + currentTime)
    $('.time').data("time_id" , {first: collectionID})

   });
}

function removeSelected(){
  console.log("removeSelected was called")

    $(".nodeButton").each(function(){
      console.log(this)
      if($(this).attr("class")){
        console.log(this)
        $(this).removeClass("selected")

      }
    })

    $(".appButton").each(function(target){
      if($(this).attr("class")){
        $(this).removeAttr("selected")
      }
    })
  }

function findAddEdges(time_id, name){
  //Add node
  add(name);

  //fetch it's connections
  var connectedNodesCollection = new ConnectedNodesCollection([],{id: time_id, node_name: name })
  getConnected = connectedNodesCollection.fetch()
  getConnected.done(function(){

  	connectedNodesCollection.forEach(function(edge){

          //add it's connections
          if(edge.get('toID') === name)
          	add(edge.get('fromID'), edge.get('toID'))
          else if(edge.get('fromID') === name)
          	add(edge.get('toID'), edge.get('fromID'))

      });
  });
}

function populateApplications(){
    applicationCollection = new ApplicationCollection();
    getApps = applicationCollection.fetch();

    getApps.done(function(){

      $('#application-container .list-group a').remove()

      applicationCollection.forEach(function(application){
        $('#application-container .list-group').append("<a href='#' class='list-group-item appButton' data-name='"+ application.get('name') + "'>" + application.get('name') + "</a>");
      });
    });
}


var main_collection = new TimemodelCollection();
var fetch = main_collection.fetch({update: true, merge: false, remove: false, add: true});
var applicationCollection;
var nodesCollection;


var timemodelView1 = new TimemodelView1();

populateApplications();


$(".application-menu").click(function(){
  console.log("button was clicked")
  $("#server-container").css("display", "none")
  $("#application-container").css("display", "block")
  $(".server-menu-text-box").css("display", "none")
})

$(".server-menu").click(function(){
  $("#application-container").css("display", "none")
  $("#server-container").css("display", "block")
  $(".server-menu-text-box").css("display", "block")
})


