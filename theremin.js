//Higher notes are played by moving the hand closer to the pitch antenna.
//Louder notes are played by moving the hand away from the volume antenna.
$(document).ready(function() {
	//Setup
	var maxFreq = 5000;
	var maxVol = 2;
	
	var $rightHand = $('#rightHand');
	var $leftHand = $('#leftHand');
	var $volAnt = $('#volAnt');
	var $freqAnt = $('#freqAnt');
	
	var currentFreq = 440.0;
	var currentVol = 1.0;
	var playing = false
	
	//loudes/highest hand positions
	var volPos = Math.sqrt(
					Math.pow(Math.abs($volAnt.offset().top),2) + 
					Math.pow(Math.abs($volAnt.offset().left),2));
	var freqPos = Math.sqrt(
					Math.pow(Math.abs($(window).height() - $freqAnt.offset().top),2) + 
					Math.pow(Math.abs($(window).width()- $freqAnt.offset().left),2));
	
	//Set up audio objects
	//http://modernweb.com/2013/10/28/audio-synthesis-in-javascript/
	var context = new window.AudioContext();
	var gainNode = context.createGain();
	gainNode.connect(context.destination);
	
	//Set initial position of hands
	$rightHand.css('top', $freqAnt.offset().top + ($freqAnt.height() / 3));
	$rightHand.css('left', $freqAnt.offset().left + 75);
	$leftHand.css('top', $volAnt.offset().top + ($volAnt.height() / 3));
	$leftHand.css('left', $volAnt.offset().left - ($leftHand.height() / 3));
	
	//Start and stop theramin when spacebar is pressed
	$(document).keypress(function(key) {
		switch(key.which) {
			case 32:
				if (playing) {
					osc.stop();
					playing = false;
					$('#freq').html("0.00");
					$('#vol').html("0.00");
				} else {
					osc = context.createOscillator();
					osc.type = 'sine';
					osc.frequency.value = currentFreq;
					osc.connect(context.destination);
					osc.connect(gainNode);
					osc.start(0);
					playing = true;
					$('#freq').html(currentFreq.toFixed(2));
					$('#vol').html(((currentVol + 1)/2).toFixed(2));
				}
			break;
		}
	});
	
	//Adjust gain and frequency based on how close hands are to antennae
	function adjust() {
		var freqDist = Math.min(freqAntDist($rightHand), freqAntDist($leftHand));
		var volDist = Math.min(volAntDist($rightHand), volAntDist($leftHand));
		currentVol = Math.min((maxVol * (volDist / volPos)) - 1, maxVol);
		currentFreq = Math.min(maxFreq * (freqDist / freqPos), maxFreq);
		gainNode.gain.value = currentVol;
		if (playing) {
			osc.frequency.value = currentFreq;
			$('#freq').html(currentFreq.toFixed(2));
			$('#vol').html(((currentVol + 1)/2).toFixed(2));
		}
	}
	
	//Let user control hands with keys (arrows for right, wasd for left)
	var w = $(window).width() - $rightHand.width();
	var h = $(window).height() - $rightHand.height();
	distance = 5;
	var d = {};
	function newv(hand,a,b) {
		if(a === 37 | a === 65) {
			limit = w;
			v = hand.offset().left;
		} else {
			limit = h;
			v = hand.offset().top;
		}
		var n = parseInt(v, 10) - (d[a] ? distance : 0) + (d[b] ? distance : 0);
		return n < 0 ? 0 : n > limit ? limit : n;
	}
	$(window).keydown(function(e) { d[e.which] = true; });
	$(window).keyup(function(e) { d[e.which] = false; });
	setInterval(function() {
		$rightHand.css({
			left: function(i,v) { return newv($rightHand, 37, 39); },
			top: function(i,v) { return newv($rightHand, 38, 40); }
		});
		$leftHand.css({
			left: function(i,v) { return newv($leftHand, 65, 68); },
			top: function(i,v) { return newv($leftHand, 87, 83); }
		});
		adjust();
	}, 20);
	
	//Calculate distances of hands from antennae
	function volAntDist(hand) {
		var volDist = 0.0;
		if (hand.offset().left > $volAnt.offset().left && hand.offset().left < ($volAnt.offset().left + $volAnt.width())) {
			if (hand.offset().top < ($volAnt.offset().top + ($volAnt.height() / 2))) {
				//Inside above
				volDist = Math.abs(hand.offset().top - $volAnt.offset().top);
			} else {
				//Inside below
				volDist = Math.abs(hand.offset().top - ($volAnt.offset().top + ($volAnt.height())));
			}
		} else if (hand.offset().left < $volAnt.offset().left) {
			if (hand.offset().top > $volAnt.offset().top && hand.offset().top < ($volAnt.offset().top + $volAnt.height())) {
				//Left inside
				volDist = Math.abs(hand.offset().left - $volAnt.offset().left);
			} else if (hand.offset().top < ($volAnt.offset().top + $volAnt.height())) {
				//Left above
				volDist = Math.sqrt(Math.pow(hand.offset().top - $volAnt.offset().top,2) + Math.pow(hand.offset().left - $volAnt.offset().left,2));
			} else {
				//Left below
				volDist = Math.sqrt(Math.pow(hand.offset().top - ($volAnt.offset().top + $volAnt.height()),2) + Math.pow(hand.offset().left - $volAnt.offset().left,2));
				//alert(volDist);
			}
		} else {
			if (hand.offset().top < ($volAnt.offset().top + ($volAnt.height() / 2))) {
				//Right above
				volDist = Math.sqrt(Math.pow(hand.offset().top - $volAnt.offset().top,2) + Math.pow(hand.offset().left - ($volAnt.offset().left + $volAnt.width()),2));
			} else {
				//Right below
				volDist = Math.sqrt(Math.pow(hand.offset().top - ($volAnt.offset().top + $volAnt.height()),2) + Math.pow(hand.offset().left - ($volAnt.offset().left + $volAnt.width()),2));
			}
		}
		return volDist;
	}
	function freqAntDist(hand) {
		var freqAntHeight = $freqAnt.height() - $('#control').height();
		var freqDist = 0.0;
		if (hand.offset().top > $freqAnt.offset().top && hand.offset().top < $freqAnt.offset().top + freqAntHeight) {
			//Hand within vertical range of antenna
			freqDist = Math.abs(hand.offset().left - $freqAnt.offset().left);
		} else if (hand.offset().top >= $freqAnt.offset().top + freqAntHeight) {
			//Hand below rod
			freqDist = Math.sqrt(Math.pow(hand.offset().top - $freqAnt.offset().top - freqAntHeight,2) + Math.pow(hand.offset().left - $freqAnt.offset().left,2));
		} else {
			//Hand above rod
			freqDist = Math.sqrt(Math.pow(hand.offset().top - $freqAnt.offset().top,2) + Math.pow(hand.offset().left - $freqAnt.offset().left,2));
		}
		return freqDist;
	}
});	