let score = 0;
let best_score = 0;
let level = 1;
let time = 10;
let fullTime = 10;
let widthTime = 0;
let run;

function startGame() {
    $('#start_scr').css('display', 'none');
    $('#time').css('width', '100%');
    score = 0;
    level = 1;
    time = 10;
    fullTime = 10;
    widthTime = 0;

    time = fullTime;
    widthTime = document.getElementById("time").offsetWidth;
    $('#score').html(score);
    $('#level').html(level);
    generateCalculation();
    countDown();
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getRandomOperator() {
    let operators = ["+", "-", "*"];
    let ran = Math.floor(Math.random() * operators.length);
    return operators[ran];
}

function generateCalculation() {
    let number1 = getRandomNumber(1 * level, 5 * level);
    let number2 = getRandomNumber(1 * level, 5 * level);
    let op = getRandomOperator();
    let cal = number1 + " " + op + " " + number2;
    if (level >= 10) {
        cal = number1 + " " + op + " " + number2 + getRandomOperator() + " " + getRandomNumber(2, 10);
    }
    $("#calculation").html(cal);
    $("#result").html(getRandomResult(cal));
}

function getRandomResult() {
    let randomResult = Math.random() >= 0.5;
    return randomResult ? getResult() : getFakeResult();
}

function getResult() {
    return eval($('#calculation').html());
}

function getFakeResult() {
    let fakeResult = getRandomNumber(getResult() - getRandomNumber(2, 20), getResult() + getRandomNumber(2, 20));
    return (fakeResult === getResult()) ? getFakeResult() : fakeResult;
}

function countDown() {
    let timeDiv = document.getElementById("time");
    run = setInterval(function () {
        time -= 0.1;
        timeDiv.style.width = widthTime * time / fullTime + "px";
        if (time <= 0) {
            clearInterval(run);
            gameOver(true);
        }
    }, 100);
}

function check(btn) {
    let result = parseInt($('#result').html());
    let check = false;
    switch (btn) {
        case "true":
            if (result === getResult()) check = true;
            break;
        case "false":
            if (result !== getResult()) check = true;
            break;
    }
    let text1 = $('#calculation').html() + ' = ' + result;
    let text2 = 'You selected ' + '<span class="' + btn + '">' + $('#' + btn).html() + '</span>';
    check ? nextLevel() : gameOver([text1, text2]);
}

function nextLevel() {
    score += parseInt(1.5 * level);
    level++;
    fullTime = 2.5 + 8 / level;
    time = fullTime;
    $('#score').html(score);
    $('#level').html(level);
    document.getElementById("correct").currentTime = 0;
    document.getElementById("correct").play();
    generateCalculation();
}

function gameOver(timeout) {
    if (timeout === true) {
        $('#modal_gameover_ctn').html("Time up! <br> Your score is " + score);
    } else {
        $('#modal_gameover_ctn').html("Your score is " + score + "<br>" + timeout[0] + ". " + timeout[1]);
    }


    document.getElementById("wrong").play();
    clearInterval(run);

    $('#modal_gameover').modal('show');
    $('#start_scr').css('display', 'block');

    best_score = (score > best_score) ? score : best_score;
    $('#best-score').html(best_score);
}

function layout() {
    var ratio_main = 12 / 7;
    var main_width = $('#main').css('width')
    $('#main').css('height', ratio_main * parseInt(main_width) + 'px');
}

function login() {
    $('#key-jwk').trigger('click');
}

function beforeLogin() {
    $('#not-login').css('display', 'block');
    $('#login-success').css('display', 'none');
    $('#btn-login').html('LOGGING ...').prop('disabled', 'disabled');
}

function onLoginSuccess() {
    $('#btn-login').html('LOGIN').prop('disabled', false);

    $('#address').html(my_arweave.address);
    $('#balance').html(my_arweave.balance.ar);

    $('#not-login').css('display', 'none');
    $('#login-success').css('display', 'block');
    getRankingInfo();
}

function onLoginError(err) {
    $('#btn-login').html('LOGIN').prop('disabled', false);
}

function readFile(evt) {
    var files = evt.target.files;
    var file = files[0];
    var reader = new FileReader();
    reader.onload = function (event) {
        var jwk = event.target.result;
        jwk = JSON.parse(jwk);
        my_arweave.init().then(function () {
            my_arweave.login(jwk);
        });
    };
    reader.readAsText(file);
}

async function getRankingInfo() {
    const txids = await my_arweave.arweave.arql({
        op: "and",
        expr1: {
            op: 'equals',
            expr1: 'App',
            expr2: 'crazy-math'
        },
        expr2: {
            op: 'equals',
            expr1: 'Type',
            expr2: 'score'
        }
    }).then(data => {
        showRankingInfo(data);
    });

}

function showRankingInfo(txids) {
    $('#ranking').html('');
    for (var i = 0; i < txids.length; i++) {
        var txId = txids[i];
        let tx = my_arweave.arweave.transactions.get(txId).then(transaction => {
            let data = transaction.get('data', {decode: true, string: true}).toString();
            try {
                data = JSON.parse(data);
                var html = '<tr class="user-score" id="' + transaction.id + '" data-scr="' + data['score'] + '" >' +
                    '<th id="index_' + transaction.id + '" scope="row">_</th>' +
                    '<td>' + data['name'] + '</td>' +
                    '<td>' + data['score'] + '</td>' +
                    '</tr>';
                $('#ranking').append(html);
                sortRank();
            } catch (e) {
                console.log(e);
            }
        });
    }
}

function sortRank() {
    $('tr.user-score').sort(function (a, b) {
        let a_val = parseInt($(a).attr('data-scr'));
        let b_val = parseInt($(b).attr('data-scr'));
        return b_val - a_val;
    }).appendTo('#ranking');
    $("tr.user-score").each(function (i, l) {
        let id_tx = $(this).attr('id');
        $('#index_' + id_tx).html(i + 1);
    });
}

async function submit() {
    var urname = $('#your_name').val();
    if (urname.trim() === '') {
        alert('Enter your name !');
        $('#your_name').focus();
        return;
    }
    if (!my_arweave.loggedIn) {
        alert('Please login before submit your score !');
        login();
        return;
    }

    if (best_score < 25) {
        alert('Your best score is too low. Let\'s play again ! You need at least 25 points.');
        return;
    }

    let response = await my_arweave.submitTrans(JSON.stringify({'name': urname, 'score': best_score,}), {
        'App': 'crazy-math', 'App-Version': '1.0.0', 'Type': 'score',
    });

    if (response.status === 200) {
        alert('Your score has been submitted !');
    } else {
        alert('Error! ' + response.statusText);
    }
}

$(document).ready(function () {
    layout();
    my_arweave.init();
    let pr = getRankingInfo();

});
