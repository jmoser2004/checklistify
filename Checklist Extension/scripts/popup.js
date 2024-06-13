var items = [];

$(function(){
    entered = true;

    chrome.storage.sync.get('items', function(savedChecklist){
        if(savedChecklist.items.length > 0) items = JSON.parse(savedChecklist.items);

        for(i = 0; i < items.length; i++) addItem(items.at(i), i);
    });

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
    html = "<p class=\"item" + num + "\">" + text + "</p>";
    $('#checklistItems').append($(html).click(function(){
        removeClass = ".item" + parseInt(num);
        $(removeClass).remove();
        items.splice(items.indexOf(text), 1);
        console.log(items);
        chrome.storage.sync.set({'items': JSON.stringify(items)});
    }));
}