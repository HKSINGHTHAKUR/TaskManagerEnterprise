from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, HiddenField
from wtforms.validators import DataRequired, Length

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(1, 50)])
    password = PasswordField('Password', validators=[DataRequired()])

class TaskForm(FlaskForm):
    task_id = HiddenField()
    title = StringField('Title', validators=[DataRequired(), Length(1, 255)])
