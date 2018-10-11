/* Initialize search fields. */
const notifMarkAllRead = $('.notifMarkAllRead')
const notifSettings = $('.notifSettings')
const notifShowAll = $('.notifShowAll')

notifMarkAllRead.click(() => {
    alert('mark ALL read')
})

notifSettings.click(() => {
    alert('show settings')
})

notifShowAll.click(() => {
    alert('show ALL activities')
})

/**
 * Load Notification
 */
const loadNotif = (_notifId) => {
    alert(`loading notification [ ${_notifId} ]`)
}
