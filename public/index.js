$("#download").click(function () {
    console.log('Try to Download...');
    $.post("/request",
        {
            name: $("#aname").val()
        },
        function (data, status) {
            console.log(data);
        });
    $.get("/results", function (data, status) {
        //console.log("the data:", data.timelength);
        if(data.status){
            $("#result").html("Video Length: " + Math.round(data.timelength/60000.0) + " minutes" + "<br>"
            + "Video Quality: " + data.quality.slice(-5).substring(0, 4) + "<br>" 
            + data.download_status);
        } else{
            $("#result").html("Not Matched");
        }
    });
});

$("#merge").click(function () {
    console.log("Try to Generate...");
    $.post("/merge", function (data, status) {
    });
});
