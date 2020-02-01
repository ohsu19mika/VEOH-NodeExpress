
const notes_view = ((data)=>{
    let html =`
        <html>
        <head><title>MemoApp</title>
            <meta http-equiv="Content-Type", content="text/html;charset=UTF-8">
        </head>
        <body>
            Logged in as user: ${data.user_name}
            <form action="/logout" method="POST">
                <button type="submit">Log out</button>
            </form>
            <form action="/add-note" method="POST">
                <input type="text" name="note">
                <button type="submit">Add note</button>
            </form>`;

        data.notes.forEach((note) => {
            html+=`
            <div>${note.text}
            <form action="/delete-note" method="POST">
                <input type="hidden" name="note_id", value="${note._id}">
                <button type="submit" class="delete_button">Delete note</button>
            </form>
            </div>`;
        });
        html+=`
        </body>
        </html>
        `;

    return html;
})

module.exports.notes_view = notes_view;