function formatDateTime(dateTimeString) {
    const dateObj = new Date(dateTimeString);

    const date = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    const hours = dateObj.getHours();
    const minutes = dateObj.getMinutes();

    // Padding single-digit values with leading zeros
    const paddedDate = date.toString().padStart(2, "0");
    const paddedMonth = month.toString().padStart(2, "0");
    const paddedHours = hours.toString().padStart(2, "0");
    const paddedMinutes = minutes.toString().padStart(2, "0");

    // Constructing the formatted date and time string
    const formattedDateTime = `${paddedDate}/${paddedMonth}/${year} at ${paddedHours}:${paddedMinutes}`;

    return formattedDateTime;
  }

  export default formatDateTime 