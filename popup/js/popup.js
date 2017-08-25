jQuery(function () {
	
	function escapeHTML(str) str.replace(/[&"<>]/g, function (m) ({ "&": "&amp;", '"': "&quot;", "<": "&lt;", ">": "&gt;" })[m]);

	function tosdrPoint(serviceName ,dataPoint){
	  var badge, icon, sign;
	  if(dataPoint){
	    if (dataPoint.tosdr.point == 'good') {
	      badge = 'badge-success';
	      icon = 'thumbs-up';
	      sign = '+';
	    } else if (dataPoint.tosdr.point == 'bad') {
	      badge = 'badge-warning';
	      icon = 'thumbs-down';
	      sign = '-';
	    } else if (dataPoint.tosdr.point == 'blocker') {
	      badge = 'badge-important';
	      icon = 'remove';
	      sign = '×';
	    } else if (dataPoint.tosdr.point == 'neutral') {
	      badge = 'badge-neutral';
	      icon = 'asterisk';
	      sign = '→';
	    } else {
	      badge = '';
	      icon = 'question-sign';
	      sign = '?';
	    }
	    var pointText = dataPoint.tosdr.tldr;

	    //Extract links from text
	    var taggedText = pointText.split(/(<\/?\w+(?:(?:\s+\w+(?:\s*=\s*(?:".*?"|'.*?'|[^'">\s]+))?)+\s*|\s*)\/?>)/gim);
	    $('#popup-point-' + serviceName + '-' + dataPoint.id)
	      .append($("<div>", { class: dataPoint.tosdr.point })
	      .append($("<h5>")
	        .append($("<span>", { class: 'badge ' + badge , title: escapeHTML(dataPoint.tosdr.point) })
	          .append($("<span>", { class: 'glyphicon glyphicon-' + icon}))
	        )
	        .append($("<span>").text(" " + dataPoint.title + " "))
	        .append($("<a>", { href: escapeHTML(dataPoint.discussion) , target: '_blank', class : 'label context' , text: 'Discussion'}))
	      ));

	    $('#popup-point-' + serviceName + '-' + dataPoint.id).append($("<p>"));
	    if(taggedText.length > 1){
	      for(i =0; i< taggedText.length; i++){
	        var hrefRegex = /href=("|')(.*?)("|')/g;
	        var tagsRegex = /<(em|strong)>/g;
	        var hrefResults = hrefRegex.exec(taggedText[i]);
	        var tagsResults = tagsRegex.exec(taggedText[i]);

	        if(hrefResults){
	          var url = (hrefResults[2].match(/^index\.html/)) ? "https://tosdr.org/" + hrefResults[2] : hrefResults[2];
	          $('#popup-point-' + serviceName + '-' + dataPoint.id + ' p').append($("<a>", {href : escapeHTML(url), text: escapeHTML(taggedText[i+1]), class : "pointshref" , target : "_blank"}));
	          i+= 2;
	        }else if(tagsResults){
	          var tag = tagsResults[1];
	          $('#popup-point-' + serviceName + '-' + dataPoint.id + ' p').append($("<" + escapeHTML(tag) + ">", {text : escapeHTML(taggedText[i+1]) }));
	          i+= 2;
	        }else{
	          $('#popup-point-' + serviceName + '-' + dataPoint.id + ' p').append(escapeHTML(taggedText[i]));
	        }
	      }
	    }else{
	      $('#popup-point-' + serviceName + '-' + dataPoint.id + ' p').text(escapeHTML(pointText));
	    }

	  }
	};
	
	
	var NOT_RATED_TEXT = "We haven't sufficiently reviewed the terms yet. Please contribute to our group: <a target=\"_blank\" href=\"https:\/\/groups.google.com/d/forum/tosdr\">tosdr@googlegroups.com</a>.";
	var RATING_TEXT = {
		0: NOT_RATED_TEXT,
		"false": NOT_RATED_TEXT,
		"A": "The terms of service treat you fairly, respect your rights and follows the best practices.",
		"B": "The terms of services are fair towards the user but they could be improved.",
		"C": "The terms of service are okay but some issues need your consideration.",
		"D": "The terms of service are very uneven or there are some important issues that need your attention.",
		"E": "The terms of service raise very serious concerns."
	};
	
	var serviceName = window.location.hash.substr(1);
	function updatePopup() {
		$(".loading").show();
		
		getServiceData().then((service)=>{			
			if(serviceName === "none"){
				$("#page").empty();
				$('#page').append($("<div>", {class : 'modal-body'})
				.append($("<div>", {class : 'tosdr-rating' })
				.append($("<h4>", { text : 'Not rated, yet.'}))
				.append($("<p>",{ text : 'Write an email to tosdr@googlegroups.com with a link to the terms, a small quote from the terms about the point you‘re making and let us know if you think it‘s a good or a bad point. It‘s better to do one email thread by topic, rather than one email per service. For more details, read on!' , class : 'lbldesc'}))));
			}else{
				$("#service_url").attr('href', 'http://tosdr.org/#' + serviceName);
	  
				//Update class
				$("#service_class").addClass(service.class);
				if(service.class){
					$("#service_class").text("Class " + service.class);
				}else{
					$("#service_class").text("No Class Yet");
				}
				$("#ratingText").text(RATING_TEXT[service.class]);
				
				
				//Points
				var sortedPoints = [];
				for (var point in service.pointsData) {
					sortedPoints.push(service.pointsData[point]);
				}
				sortedPoints.sort(function(x,y){return y.tosdr.score - x.tosdr.score});
				// append points
				for (point in sortedPoints){
					$('.tosdr-points').append($("<li>", {id : 'popup-point-' + service.name + '-' + sortedPoints[point].id , class:'point'}));
					 tosdrPoint(service.name, sortedPoints[point]);
				}
			 
				
				// links inside of the dataPoints should open in a new window
				$('.tosdr-points a').attr('target', '_blank');
				
				if(Object.keys(service.links).length > 0){
					$('#linksList')
					.append($("<h4>", { text : 'Read the Terms'}))
					.append($("<ul>", {class: 'tosback2'}));

					for (var i in service.links) {
						$('.tosback2').append($("<li>")
						.append($("<a>", { href:service.links[i].url , target: '_blank' , text :(service.links[i].name ? service.links[i].name : i)})));
					}
				}
				
		  
			}
			// [x] Button
			$('#closeButton,.close').click(function () {
				window.close();
			});
			
			$(".loading").hide();
		});
	}
	
	updatePopup();
	
	function getServiceData(){
		if(serviceName === "none")
			return Promise.resolve("none");
		
		let requestURL = 'https://tosdr.org/api/1/service/' + serviceName + '.json';
  
		const driveRequest = new Request(requestURL, {
			method: "GET"
		});

		return fetch(driveRequest).then((response) => {
			if (response.status === 200) {
				return response.json();
			} else {
				throw response.status;
			}
		});
	}
});
