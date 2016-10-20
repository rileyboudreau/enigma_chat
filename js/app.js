
/*	ENTER YOUR APP'S JAVASCRIPT CODE HERE!	*/

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
  var auth = new firebase.auth();
  var database = new firebase.database();
  var loggedUser = {};

  // Firebase refs
  var profileRef = database.ref('/profiles');
  var userMessageRef = database.ref('/user-messages');
  var messageDateRef = database.ref('/message-date');
  var encryptionKeyRef = database.ref('/encryption-keys');
  var purgedAccountIPRef = database.ref('/purged-accounts');

  // send new message
  $("#send-msg").click(function() {

    // get the event values from the input elements
    var newMessage = $("#msg").val();
    var messageEkey = $("#e_key_send").val();

    // do an error check
    if (newMessage == "") {
      alert("Cannot send empty messages!");
    }
    if (messageEkey == "") {
      alert("Cannot send messages without an encryption key!");
    }
    else {
      // error check passes

      // new message
      var newMessage = {
        message: newMessage,
        e_key: messageEkey,
      };

      // push to the events and usercreatedevents tables 
      // (they will be created if they aren't there already)
      userMessageRef.child(loggedUser.id).push(newMessage);

      // reset the values so the user doesn't have to if they
      // want to add another event
      $("#msg").val('');
      $("#e_key_send").val('');
    }
  });

  // event listener for the login button
  $("#btn-login").click(function() {

    // sign in via popup
    // PRO TIP: remember, .then usually indicates a promise!
    auth.signInWithPopup(facebookProvider).then(function(result) {

      $(".login-window").hide();
      $(".main-window").show();
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
          // persistently listen for changes to the events
          userMessageRef.child(loggedUser.id).on('value', function(snapshot) {

          // get a readable value (snapshot is initially sent back as an unreadable object)
          var snapshotValue = snapshot.val();

          // all of the snapshot keys
          var keys = Object.keys(snapshotValue);

          // populate the div with the id 'events-list'
          $(".chat-message").html("");
          for (var i = 0; i < keys.length; i++) {

            // append a new list item
            $(".chat-message").append(`
              <div class="row">
                <div class="col-sm-10">
                  ${snapshotValue[keys[i]]['message']}
                </div>
              </div>
            `);
            }
          });
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