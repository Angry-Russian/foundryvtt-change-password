
class PasswordFieldInjector {

    #formTemplate = `
        <form id="user-change-password" autocomplete="off">
            <p>
                This will permanently change your password to the new value. You will be logged out and will need to log back in with the new password.
            </p><p>
                <strong>This action cannot be undone.</strong>
            </p>
            <hr/>
            <div class="form-group">
                <label for="newPassword"> New Password: </label>
                <div class="form-fields"><input type="password" name="newPassword" id="newPassword" autocomplete="new-password" /></div>
            </div>
            <div class="form-group">
                <label for="confirmPassword"> Confirm Password: </label>
                <div class="form-fields change-password-status"><input type="password" name="confirmPassword" id="confirmPassword" autocomplete="new-password" /></div>
            </div>
            <hr/>
        </form>`

    #buttonTemplate = `
        <button type="button">Change Password</button>
    `

    constructor(userConfig, html, {user, actors, options}){
        if( html.attr('id') === 'UserConfig-User-' + game.userId ){
            let button = $(this.#buttonTemplate).on('click', () => this.showDialog())
            html.find('.form-group').eq(1).after(button);
        }
    }

    async showDialog(){
        let password = undefined
        const confirmed = await Dialog.confirm({
            title: "Change Password",
            defaultYes: true,
            rejectClose: false,
            content: this.#formTemplate,
            jQuery: true,
            render: ([content, text, buttons]) => {
                const c = $(content)
                const b = $(buttons)

                const newPassword = c.find('#newPassword')
                const confirmPassword = c.find('#confirmPassword')

                setTimeout(() => newPassword.focus(), 150)

                const passwordConfirmed = () => {
                    const p1 = newPassword.val()
                    const p2 = confirmPassword.val()
                    return {
                        errors: [
                            (p1.length < 5) && 'Your password should be at least 5 characters long' || '',
                            (p1 !== p2) && 'The two passwords fields must match' || ''
                        ].filter(e => !!e),
                        value: p1.length > 5 && p1 === p2
                    }
                }

                b.find('.yes').attr('disabled', 'disabled')
                c.on('change keydown keyup', '[type=password]', e => {
                    let isValid = passwordConfirmed();
                    b.find('.yes').attr('disabled', !isValid.value && 'disabled')


                    if(e.currentTarget.id === 'confirmPassword'){
                        confirmPassword.parent('.change-password-status').toggleClass('change-password-status-ok', isValid.value);
                        confirmPassword.parent('.change-password-status').toggleClass('change-password-status-error', !isValid.value);
                    }

                    if(e.key === 'Enter' || e.keyCode === 13) {
                        if(e.target === newPassword.get(0))
                            confirmPassword.focus().select()
                        return (e.target === confirmPassword.get(0) && isValid.value)
                    } else if(e.type === 'keyup' && isValid) {
                        password = newPassword.val()
                    } else if(e.type === "change" && e.currentTarget.id === 'confirmPassword' && !isValid.value) {
                        game.tooltip.activate(confirmPassword.get(0), {text: isValid.errors.join('<br/>'), direction: "RIGHT"})
                    } else {
                        game.tooltip.deactivate()
                    }

                })
            },
        })

        if(!!confirmed && !!password) game.user.update({ password })
    }

    static register(){
        Hooks.on('renderUserConfig', (userConfig, html, data) => new PasswordFieldInjector(userConfig, html, data));
    }
}


// sort-of equivalent of Python's `if __name__ == '__main__'` as long as you add "#module" to the import path
if(!import.meta.url.toString().endsWith('#module')){
    PasswordFieldInjector.register();
}