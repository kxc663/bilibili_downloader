// search button click event
$("#search").click(function () {
    $("#save_btn").hide();
    $("#result").html("<br><br><br><br>" + "Searching...");
    console.log('Gathering Data...');

    // check the status of video and audio file download on server side every second
    var status_check = setInterval(function () {
        $.get("/status", function (data, status) {
            console.log(data);
            // both video and audio file download completed on server side
            if (data.download_status && !data.is_finished) {
                $("#result").html("<br><br><br><br>" + "Process Completed! Please Click 'Save' to Download");
                $("#save_btn").show();
                // download completed on client side
            } else if (data.is_finished) {
                console.log("Download Completed");
                $("#result").html("<br><br><br><br>" + "Download Completed!!");
                $("#save_btn").hide();
                clearInterval(status_check);
            } else {
                console.log("DOWNLOADING...");
            }
        });
    }, 1000);

    // send url to server side and get status from server side
    $.post("/request",
        {
            name: $("#aname").val(),
            status: false
        },
        function (data, status) {
            if (!data.status) {
                $("#result").html("<br><br><br><br>" + "Please provide a valid Bilibili URL");
            }
        });

    // get the video data from server side
    $.get("/results", function (data, status) {
        console.log(data);
        if (data.status) {
            $("#result").html("Title: " + data.title + "<br>"
                + "Author: " + data.author + "<br>"
                + "Video Length: " + convertTimeLength(data.timelength) + "<br>"
                + "Video Quality: " + data.quality.slice(-5).substring(0, 4) + "<br>" + "<br>"
                + "Successfully Gathering Video Data! Start Processing...");
        } else {
            $("#result").html("Not Matched");
        }
    });
});

// convert the time length from ms to h:m:s
function convertTimeLength(ms) {
    var output = "";
    var seconds = ms / 1000;
    const hours = parseInt(seconds / 3600);
    seconds = seconds % 3600;
    const minutes = parseInt(seconds / 60);
    seconds = Math.round(seconds % 60);
    output = hours + "h:" + minutes + "m:" + seconds + "s";
    return output;
}