$(function(){
    $('.watchChild').inScreenArea({
        debug: true,
        offset: '30%',
        height: '40%',
        elementTolerance: '50%'
    })
    .on('area:out', function(){
        $(this).find('.animated').each(function(){
            $(this).removeClass($(this).data('in'));
            $(this).addClass($(this).data('out'));
        });
    })
    .on('area:in', function() {
        $(this).find('.animated').each(function(){
            $(this).removeClass('invisible');

            $(this).removeClass($(this).data('out'));
            $(this).addClass($(this).data('in'));
        });
    })
});