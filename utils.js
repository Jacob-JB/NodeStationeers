module.exports.addEventSystem = object => {
    let eventList = []

    object.onEvent = (eventName, callback) => {
        let listener = {eventName: eventName, callback: callback}
        eventList.push(listener)

        return () => {
            eventList.splice(eventList.indexOf(listener), 1)
        }
    }
    object.fireEvent = function(eventName) {
        let returnList = []
        eventList.forEach(e => {
            if (e.eventName == eventName) {
                returnList.push(
                    e.callback(...[...arguments].slice(1, arguments.length))
                )
            }
        })
        return returnList
    }
}