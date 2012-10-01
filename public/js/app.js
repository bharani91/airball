/* --------------------------------------------
 * Dribbblin' v1.0
 * URL: http://dribbblin.io
 * Author: Bharani Muthukumaraswamy <bharani91@gmail.com>
 * Author URL: http://bharani.herokuapp.com
 --------------------------------------------*/

jQuery(document).ready(function($) {

  window.Shot = Backbone.Model.extend();

  window.Comment = Backbone.Model.extend({

    initialize: function() {
      this.url = "http://api.dribbble.com/shots/" + this.get("id") + "/comments";
    },

    sync: function(method, model, options) {
      options = options || {};
      options.dataType = "jsonp"; 
      Backbone.sync(method, model, options);
    }  

  });

  window.ShotList = Backbone.Collection.extend({
    model: Shot,
    url: "http://api.dribbble.com/shots/",
    
    parse: function(resp) {
      return resp.shots
    },

    sync: function(method, model, options) {
      options = options || {};
      options.dataType = "jsonp"; 
      Backbone.sync(method, model, options);
    }          

  });

  window.PopularList = ShotList.extend({
    page: 1,

    url: function() {
      return "http://api.dribbble.com/shots/popular?page=" + this.page
    },
    
  });

  window.EveryoneList = ShotList.extend({
    page: 1,

    url: function() {
      return "http://api.dribbble.com/shots/everyone?page=" + this.page
    },

  });

  window.DebutList = ShotList.extend({
    page: 1,

    url: function() {
      return "http://api.dribbble.com/shots/debuts?page=" + this.page
    },

  });


  window.ShotView = Backbone.View.extend({
    tagName: "li",
    className: "item",
    
    template: _.template($('#shot_template').html()),

    render:function () {
      $(this.el).html(this.template(this.model.toJSON())) ;
      return this;
    },
  });

  window.ShotContainerView = Backbone.View.extend({
    tagName: "ul",
    className: ".post_list",


    initialize: function()  {
      $(".sidebar").bind("scroll", {el: this}, this.checkScroll);
      this.collection.on("reset", this.render, this);
      this.isLoading = false; // flag to prevent multiple GET requests
    },

    preload: function(shots) {

      console.log("preloading");
      _.each(shots.models, function(shot,i) {
        console.log(shot.get("image_url"));
        $("<img />").attr("src", shot.get("image_url"));
      });
    },

    render: function()  {
      _.each(this.collection.models, function (post) {
        $(this.el).append(new ShotView({ model: post }).render().el);
      }, this);     
      return this;
    },

    loadResults: function () {
      that = this;
      this.isLoading = true;
      this.collection.fetch({ 
        add: true, // append to collection instead of replacing

        success: function (shots) {
          $(that.el).empty();
          _.each(shots.models, function (post) {
            $(that.el).append(new ShotView({ model: post }).render().el);
          }, that);      
          $(that.el).append(this.el);
          that.isLoading = false;
         
        }
      });      

      this.preload(this.collection);
    },


    checkScroll: function(event) {
      var triggerPoint = 200; 
      that = event.data.el;
      if( !that.isLoading && $(".sidebar").scrollTop() + $(".sidebar").height() + triggerPoint > $(".post_list_container").height() ) {
        that.collection.page += 1; // Load next page
        console.log("loading");
        that.loadResults();
      }
    }
  });

  window.ShotDetailView = Backbone.View.extend({
    template: _.template($("#shot_detail_template").html()),
    render: function()  {
      console.log("model", this.model)
      $(this.el).html(this.template(this.model.toJSON()));
      return this;
    }
  });

  window.Comment = Backbone.Model.extend();

  window.CommentsList = Backbone.Collection.extend({  
    model: Comment,
    initialize: function(options) {
      this.id = options.id;
    },

    url: function() {
      console.log(this.id)
      return "http://api.dribbble.com/shots/" + this.id + "/comments";
    },

    parse: function(resp) {
      return resp.comments
    },
    
    sync: function(method, model, options) {
      options = options || {};
      options.dataType = "jsonp"; 
      Backbone.sync(method, model, options);
    }

  });

  window.CommentListView = Backbone.View.extend({
    tagName: "ul",
    className: "comment_list",

    initialize: function()  {
      that = this
      this.collection.fetch({
        success: function() {
          that.render();
        }
      });
    },

    render: function()  {
      that = this;
      _.each(this.collection.models, function(comment) {
        $(that.el).append(new CommentView({ model: comment }).render().el);
      });
      
      $(".main").append(this.el);
    }

  });


  window.CommentView = Backbone.View.extend({
    tagName: "li",
    className: "comment",
    template: _.template($("#shot_comment_template").html()),

    render: function()  {
      $(this.el).html(this.template(this.model.toJSON())) ;
      return this;
    }
  })


  // Router
  var AppRouter = Backbone.Router.extend({
    routes:{
        ""            :       "home",
        "everyone"    :       "everyone",
        "debut"       :       "debut",
        "shot/:id"    :       "showShot",
    },

    preload: function(collection)  {
      console.log("preloading 2")
      _.each(collection.models, function(model) {
        var img = $("<img />").attr("src", model.get("image_url"));
      });
    },

    initialize: function()  {
      console.log("Initializing")
      this.popular_list = new PopularList();
      that = this;
      this.popular_list.fetch({
        success: function(collection) {
          setTimeout(function() { that.preload(collection) }, 10*1000);
        }
      });

      this.everyone_list = new EveryoneList();
      this.everyone_list.fetch({
        success: function(collection) {
          setTimeout(function() { that.preload(collection) }, 20*1000);
        }
      });
      

      
      this.debut_list = new DebutList();
      this.debut_list.fetch({
        success: function(collection) {
          setTimeout(function() { that.preload(collection) }, 30*1000);
        }
      });
      
    },
 
    home: function () {
      $(".sidebar").animate({scrollTop: 0}, "slow");
      $(".sidebar header").find(".active").removeClass("active");
      $(".sidebar header").find(".popular").addClass("active");

      this.popular_container_view = new ShotContainerView({ collection: this.popular_list });
      $('.post_list_container').html(this.popular_container_view.render().el); 

    },

    everyone: function () {
      $(".sidebar").animate({scrollTop: 0}, "slow");
      $(".sidebar header").find(".active").removeClass("active");
      $(".sidebar header").find(".everyone").addClass("active");

      this.everyone_container_view = new ShotContainerView({ collection: this.everyone_list });
      $('.post_list_container').html(this.everyone_container_view.render().el); 
    },

    debut: function () {
      $(".sidebar").animate({scrollTop: 0}, "slow");
      $(".sidebar header").find(".active").removeClass("active");
      $(".sidebar header").find(".debut").addClass("active");

      this.debut_container_view = new ShotContainerView({ collection: this.debut_list });
      $('.post_list_container').html(this.debut_container_view.render().el); 

    },

    showShot: function(item)  {
      console.log(item);
      var selected = (this.popular_list.get({id: item}) || this.everyone_list.get({id: item}) || this.debut_list.get({id: item}) );
      console.log(selected);
      this.shot_detail_view = new ShotDetailView({ model: selected });
      $('.main').html(this.shot_detail_view.render().el); 

      var comments_list = new CommentsList({ id: item });
      this.comments_view = new CommentListView({ collection: comments_list });
      
    }


  });
   
  window.app = new AppRouter();
  Backbone.history.start();



});