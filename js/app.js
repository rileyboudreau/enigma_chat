// this function fires at the ready state, which is when the DOM is
// ready for Javascript to execute
$(document).ready(function() {

	// Initialize Firebase
	// NOTE: you can also copy and paste this information from your project
	//       after you initialize it
	var config = {
    	apiKey: "AIzaSyCWH8EV9A2VLhl2SR_VqAjFUEbJgcSwgVY",
    	authDomain: "encrypted-chat-app.firebaseapp.com",
    	databaseURL: "https://encrypted-chat-app.firebaseio.com",
    	storageBucket: "",
    	messagingSenderId: "154238285018"
  	};
  	firebase.initializeApp(config);

  // some firebase variables
  var facebookProvider = new firebase.auth.FacebookAuthProvider();
  var googleProvider = new firebase.auth.GoogleAuthProvider();
  var auth = new firebase.auth();
  var database = new firebase.database();
  var loggedUser = {};
  var de_key;

  // Firebase refs
  var profileRef = database.ref('/profiles');
  var userMessageRef = database.ref('/user-messages');
  var messageDateRef = database.ref('/message-date');
  var purgedAccountIPRef = database.ref('/purged-accounts');

  // send new message
  $("#send-msg").click(function() {

    var newMessage = $("#msg").val();
    var messageEkey = $("#e_key_send").val();
    var nickName= $("#nick").val();

    // do an error check
    if (newMessage == "") {
      alert("Cannot send empty messages!");
    }
    if (messageEkey == "") {
      alert("Cannot send messages without an encryption key!");
    }
    if (nickName == "") {
      alert("You must have a nickname!");
    }
    else {
      // error check passes

      // new message
      var newMessage = {
        message: newMessage,
        nickname: nickName,
      };

      // pushes message to db
      userMessageRef.child(messageEkey).push(newMessage)

      // reset the values
      $("#msg").val('');
    }
  });

  $("#de-msg").click(function() {

    // listener variables
    if (de_key != undefined) {
     userMessageRef.child(de_key).off('value');
    }
    de_key = $("#e_key_decrypt").val();

    // persistently listen for changes to the events
    userMessageRef.child(de_key).on('value', function(snapshot) {

    // get a readable value (snapshot is initially sent back as an unreadable object)
    var snapshotValue = snapshot.val();

    // all of the snapshot keys
    var keys = Object.keys(snapshotValue);

    $(".chat-message").html("");
    for (var i = 0; i < keys.length; i++) {

      // append a new list item
      $(".chat-message").append(`
        <div class="row">
          <div class="col-sm-10">
            <p><b>${snapshotValue[keys[i]]['nickname']}:</b> ${snapshotValue[keys[i]]['message']}</p>
          </div>
        </div>
        `);
      }
    });
  });

  $("#btn-logout").click(function() {

    $(".login-window").show();
    $("#app_content").hide();
  });

  // event listener for the login button with facebook
  $("#btn-login-fb").click(function() {

    // sign in via popup
    // PRO TIP: remember, .then usually indicates a promise!
    auth.signInWithPopup(facebookProvider).then(function(result) {

      $(".login-window").hide();
      $("#app_content").show();
      console.log(result);

      // check for your profile
      profileRef.once("value").then(function(snapshot) {

        // get the snapshot value
        var snapshotValue = snapshot.val();

        // if no values present, just add the user
        if (snapshotValue == undefined || snapshotValue == null) {
          loggedUser = addNewUser(result, profileRef);
        }
        else {

          // iterate through the object, and determine if the
          // profile is present
          var keys = Object.keys(snapshotValue);
          var found = false;
          for (var i = 0; i < keys.length; i++) {

            // accessing objects:
            // way 1: objectname.objectvalue
            // way 2: objectname['objectvalue']
            if (snapshotValue[keys[i]].email == result.user.email) {
              
              // found the profile, access it
              loggedUser = snapshotValue[keys[i]];
              loggedUser.id = keys[i];
              found = true;
            }
          }

          // profile is not found, add a new one
          if (!found) {
            loggedUser = addNewUser(result, profileRef);
          }
        };
      });

    }, function(error) {
      console.log("Oops! There was an error");
      console.log(error);
    });
  });
  // event listener for the login button with google
  $("#btn-login-g").click(function() {

    // sign in via popup
    // PRO TIP: remember, .then usually indicates a promise!
    auth.signInWithPopup(googleProvider).then(function(result) {

      $(".login-window").hide();
      $("#app_content").show();
      console.log(result);

      // check for your profile
      profileRef.once("value").then(function(snapshot) {

        // get the snapshot value
        var snapshotValue = snapshot.val();

        // if no values present, just add the user
        if (snapshotValue == undefined || snapshotValue == null) {
          loggedUser = addNewUser(result, profileRef);
        }
        else {

          // iterate through the object, and determine if the
          // profile is present
          var keys = Object.keys(snapshotValue);
          var found = false;
          for (var i = 0; i < keys.length; i++) {

            // accessing objects:
            // way 1: objectname.objectvalue
            // way 2: objectname['objectvalue']
            if (snapshotValue[keys[i]].email == result.user.email) {
              
              // found the profile, access it
              loggedUser = snapshotValue[keys[i]];
              loggedUser.id = keys[i];
              found = true;
            }
          }

          // profile is not found, add a new one
          if (!found) {
            loggedUser = addNewUser(result, profileRef);
          }
        };
      });

    }, function(error) {
      console.log("Oops! There was an error");
      console.log(error);
    });
  });
});

// add new user function
// this is a function because we repeat the process and we don't want
// to repeat the code

function addNewUser(result, ref) {
    var user = {
        name: result.user.displayName,
        email: result.user.email
    };

    var newUser = ref.push(user);
    user.id = newUser.key;
    return user;
}