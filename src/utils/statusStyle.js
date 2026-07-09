function getStatusStyles(status) {
    let styles = '';

    switch (status) {
        case 'Active':
            styles = 'bg-yellow-400 text-gray-800 rounded-full px-4 py-2';
            break;
        case 'Completed':
            styles = 'bg-green-500 text-white rounded-full px-4 py-2';
            break;
        default:
            styles = 'bg-gray-400 text-gray-800 rounded-full px-4 py-2';
            break;
    }

    return styles;
}

export default getStatusStyles
