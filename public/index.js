$("#search").click(function () {
    console.log('Gathering Data...');
    setInterval(function () {
        $.get("/status", function (data, status) {
            console.log(data);
        });
    }, 1000);
    $.post("/request",
        {
            name: $("#aname").val()
        },
        function (data, status) {
            console.log(data);
        });
    $.get("/results", function (data, status) {
        console.log(data);
        if (data.status) {
            $("#result").html("Title: " + data.title + "<br>"
                + "Author: " + data.author + "<br>"
                + "Video Length: " + convertTimeLength(data.timelength) + "<br>"
                + "Video Quality: " + data.quality.slice(-5).substring(0, 4) + "<br>");
        } else {
            $("#result").html("Not Matched");
        }
    });
});

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