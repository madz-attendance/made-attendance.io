export function parseSwipe(swipe)
{
    let nameBeginIndex = swipe.indexOf('^')
    let slashIndex = swipe.indexOf('/')
    let nameEndIndex = swipe.indexOf('^', nameBeginIndex+1)

    let idNum = swipe.substring(2, nameBeginIndex)
    let name = swipe.substring(slashIndex+1, nameEndIndex)+" "+swipe.substring(nameBeginIndex+1, slashIndex)
    
    return {idNum, name}
}