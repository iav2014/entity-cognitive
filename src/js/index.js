$('.chat[data-chat=person2]').addClass('active-chat')
$('.person[data-chat=person2]').addClass('active')
$('.left .person').mousedown(function () {
	if ($(this).hasClass('.active')) {
		return false
	}
	const findChat = $(this).attr('data-chat')
	const personName = $(this).find('.name').text()
	$('.right .top .name').html(personName)
	$('.chat').removeClass('active-chat')
	$('.left .person').removeClass('active')
	$(this).addClass('active')
	$('.chat[data-chat = ' + findChat + ']').addClass('active-chat')
})

function push_statment(msg) {
	$('.chat').append('<div class="bubble me">' + msg + '</div>')
}

function push_silent_response(msg) {
	$('.chat').append('<div class="bubble you">' + msg + '</div>')
}

function push_response(msg, callback) {
	var msg2 = msg;
	if (msg.lang) {
		//alert(JSON.stringify(msg));
		msg2 = msg.msg;
	}
	if (msg2 == 'Just a second...') {
		$('.chat').append('<div class="bubble you loading">' + msg2 + '</div>')
	} else {
		
		speak_response(msg, callback)
		
		if (msg2.toUpperCase().indexOf(' CLOUD') != -1) {
			$('.chat').append('<div class="bubble you"><i class="fa fa-cloud" aria-hidden="true"></i>  ' + ' ' + msg2 + '</div>')
		} else if (msg2.toUpperCase().indexOf(' RAIN') != -1 || msg2.toUpperCase().indexOf(' DRIZZLE') != -1) {
			$('.chat').append('<div class="bubble you"><i class="fa fa-tint" aria-hidden="true"></i>  ' + ' ' + msg2 + '</div>')
		} else if (msg2.toUpperCase().indexOf(' SUN') != -1 || msg2.toUpperCase().indexOf('AND CLEAR') != -1) {
			$('.chat').append('<div class="bubble you"><i class="fa fa-sun-o" aria-hidden="true"></i>  ' + ' ' + msg2 + '</div>')
		} else if (msg2.toUpperCase().indexOf(' SNOW') != -1) {
			$('.chat').append('<div class="bubble you"><i class="fa fa-snowflake-o" aria-hidden="true"></i>  ' + ' ' + msg2 + '</div>')
		} else if (msg2.indexOf(' AM') != -1 || msg2.indexOf(' PM') != -1) {
			$('.chat').append('<div class="bubble you"><i class="fa fa-clock-o" aria-hidden="true"></i>' + ' ' + msg2 + '</div>')
		} else {
			$('.chat').append('<div class="bubble you">' + msg2 + '</div>')
		}
	}
}

function push_yt_response(id) {
	$('.chat').append('<div style="border-radius: 5px !important;" class="bubble you"><div id="player_container"><div class="player" id="player' + id + '"></div></div></div>')
}

function push_timer_response(msg) {
	if (!msg) {
		$('.chat').append('<div class="bubble you countdown"/>')
	} else {
		// $('.countdown').remove();
		const old = document.getElementsByClassName('countdown')[0]
		old.innerHTML = msg
		$('.countdown').removeClass('countdown')
	}
}

function push_movie_response(id) {
	const old = document.getElementById('movie')
	
	if (old) {
		old.innerHTML = ''
	}
	$('.chat').append('<div style="border-radius: 5px !important;" class="bubble you"><div id="movie"><div class="loader"></div></div></div>')
}

$('#textbox').keypress(function (e) {
	if (e.which == 13) {
		$(this).blur()
		log_speech($('#textbox').val())
		document.getElementById('textbox').value = ''
		
		return false
	}
})
