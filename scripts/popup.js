var items = [];
var crossed = [];
var entered = true;

$(function(){
    chrome.storage.sync.get('items', function(savedChecklist){
        if(savedChecklist.items.length > 0) items = JSON.parse(savedChecklist.items);

        for(i = 0; i < items.length; i++) addItem(items.at(i), i);
    });

    chrome.storage.sync.get('crossedItems', function(savedChecklist){
        if(savedChecklist.crossedItems.length > 0) crossed = JSON.parse(savedChecklist.crossedItems);

        for(i = 0; i < crossed.length; i++) crossItem(crossed.at(i), i, true);
    })

    $('#clear').click(function(){
        chrome.storage.sync.set({'items':[]})
        $('#checklistItems').empty();
    });

    $('#addNew').click(addItemHandler);
    $('#textbox').on('keypress', function(e){
        if(e.which === 13)
        {
            $('textbox').attr('disabled', 'disabled');
            addItemHandler();
            $('textbox').removeAttr('disabled');
        }
    })

    $('#textbox').click(function(){
        if(entered)
        {
            $('#textbox').val("");
            entered = false;
        }
    });
});

function addItemHandler(){
    var textInField = $('#textbox').val();
    if(entered || textInField === "") return;
    
    items.push(textInField);
    chrome.storage.sync.set({'items': JSON.stringify(items)});

    addItem(textInField, items.length - 1);

    entered = true;
    $('#textbox').val("Enter text here...");
}

function addItem(text, num)
{
    html = "<p id=\"item\" class=\"item" + num + "\">" + text + "</p>";
    $('#checklistItems').append($(html).click(function(){
        crossItem(!crossed[num], num, false);
    }));
    html = "<input class=\"item" + num + "\" type=\"button\" value=\"Delete\">"
    $('#checklistItems').append($(html).click(function(){
        removeClass = ".item" + parseInt(num);
        $(removeClass).remove();
        items.splice(items.indexOf(text), 1);
        console.log(items);
        chrome.storage.sync.set({'items': JSON.stringify(items)});
    }));
}

function crossItem(crossingNeeded, num, startup)
{
    html = ".item" + num;

    if(crossingNeeded)
    {
        $(html).wrap("<strike>");
        crossed[num] = true;
    }
    else if(!startup)
    {
        $(html).unwrap();
        crossed[num] = false;
    }

    chrome.storage.sync.set({'crossedItems': JSON.stringify(crossed)});
}