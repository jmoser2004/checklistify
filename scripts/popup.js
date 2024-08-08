const apiKey = "ENTER YOUR API KEY HERE"; //api key used for ChatGPT, I should probably encypt this
const apiURL = "https://api.openai.com/v1/chat/completions"; //url the api is accessed at

var items = []; //items in the checklist, contains strings
var crossed = []; //whether or not each item in the checklist is crossed out or not, contains booleans
var entered = true; //used to clear the textbox after an item is entered
var pasteboxEntered = true; //used to clear the pastebox after an item is entered


$(function(){
    //gets the items from previous sessions
    chrome.storage.sync.get('items', function(savedChecklist){
        if(savedChecklist.items.length > 0) items = JSON.parse(savedChecklist.items);

        for(i = 0; i < items.length; i++) addItem(items.at(i), i);
    });
    //gets the crossed state from previous sessions
    chrome.storage.sync.get('crossedItems', function(savedChecklist){
        if(savedChecklist.crossedItems.length > 0) crossed = JSON.parse(savedChecklist.crossedItems);
        console.log(crossed);

        for(i = 0; i < crossed.length; i++) crossItem(crossed.at(i), i, true);
    })
    //clears all items
    $('#clear').click(function(){
        chrome.storage.sync.set({'items':[]})
        chrome.storage.sync.set({'crossedItems': []});
        crossed = [];
        items = [];
        $('#checklistItems').empty();
    });
    //adds item to checklist
    $('#addNew').click(addItemHandler);
    $('#textbox').on('keypress', function(e){
        if(e.which === 13)
        {
            $('textbox').attr('disabled', 'disabled');
            addItemHandler();
            $('textbox').removeAttr('disabled');
        }
    })
    //wipes the textbox if the user has just entered an item
    $('#textbox').click(function(){
        if(entered)
        {
            $('#textbox').val("");
            entered = false;
        }
    });
    //wipes the pastebox if the user has just generated an item
    $('#pastebox').click(function(){
        if(entered)
        {
            $('#pastebox').val("");
            entered = false;
        }
    })
    //turns the text in the pastebox into an ai-generated checklist
    $('#pastebox').on('keypress', function(e){
        if(e.which === 13 && $('#pastebox').val() != "")
        {
            $('#pastebox').attr('disabled', 'disabled');
            contactChatGPT($('#pastebox').val());
            $('#pastebox').val("");
            entered = true;
            $('#pastebox').text("Paste stuff here...");
            $('#pastebox').removeAttr('disabled');
        }
    });
});

function addItemHandler(){
    var textInField = $('#textbox').val();
    if(entered || textInField === "") return; //makes sure the text is not default
    
    items.push(textInField);
    crossed.push(false);

    chrome.storage.sync.set({'items': JSON.stringify(items)});
    chrome.storage.sync.set({'crossedItems': JSON.stringify(crossed)});

    addItem(textInField, items.length - 1);

    entered = true;
    $('#textbox').val("Enter text here...");
}

function addItem(text, num)
{
    insertHere = "<div id=\"item\" class=\"itemWrap" + num + "\"></div>";
    $('#checklistItems').append(insertHere);
    insertHere = ".itemWrap" + num;
    html = "<p align=\"center\" id=\"item\" class=\"item" + num + "\">" + text + "</p>";

    $(insertHere).append($(html).click(function(){
        crossItem(!crossed[num], num, false);
    }));

    html = "<input id=\"delete\" class=\"itemButton" + num + "\" type=\"button\">"

    $(insertHere).append($(html).click(function(){
        removeClass = ".itemWrap" + parseInt(num);
        $(removeClass).remove();

        crossed.splice(items.indexOf(text), 1);
        items.splice(items.indexOf(text), 1);

        console.log(items);
        console.log(crossed);

        chrome.storage.sync.set({'crossedItems': JSON.stringify(crossed)});
        chrome.storage.sync.set({'items': JSON.stringify(items)});
    }));
}

function crossItem(crossingNeeded, num, startup)
{
    html = ".itemWrap" + num;

    if(crossingNeeded)
    {
        $(html).wrap("<strike id=\"strikerId\">");
        crossed[num] = true;
    }
    else if(!startup)
    {
        $(html).unwrap();
        crossed[num] = false;
    }

    chrome.storage.sync.set({'crossedItems': JSON.stringify(crossed)});
}

function contactChatGPT(message)
{
    const reqData = {
        model: "gpt-3.5-turbo", //I'm cheap
        messages: [
            {role: "system", content: "Turn the text in the next message into an easy to follow checklist. Make sure each step in the checklist is simple and short. Add an \"!e\" at the end of each step. Adding the \"!e\" is VERY important. Do not number or bullet the steps."}, //doesnt even work half the time lol
            {role: "user", content: message}
        ],
        max_tokens: 1000, //This SHOULD be enough
        temperature: 1
    };

    const reqOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(reqData)
    };

    addItem("generating checklist...", -1); //lets the user know the checklist is generating, this gets deleted once the checklist is generated

    fetch(apiURL, reqOptions)
     .then(response => response.json())
     .then(data =>{
        const response = data.choices[0].message.content;
        itemsToAdd = response.split("!e");

        console.log(response);
        console.log(itemsToAdd);

        itemsToAdd.forEach(item => {
            if(item !== "")
            {
                items.push(item);
                crossed.push(false);
                
                chrome.storage.sync.set({'items': JSON.stringify(items)});
                chrome.storage.sync.set({'crossedItems': JSON.stringify(crossed)});

                addItem(item, items.length - 1);
            }
        });

        $('.itemWrap-1').remove();
     })
     .catch(Error => {
        console.error(Error);
        $('.itemWrap-1').remove();
     });
}
