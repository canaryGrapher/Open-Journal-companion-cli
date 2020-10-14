const bcrypt = require('bcryptjs');
const prompt = require('async-prompt');
const connectDB = require('./config/db');
const chalk = require('chalk');
const clear = require('clear');
const Record = require('./models/Record');
const figlet = require('figlet');
const wait = require('waait');
const month = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

let passwordTries = 0;

//create a new date object
const date = new Date();

//create a default title text
const postDefaultTitle = `${
  month[date.getMonth()]
} ${date.getDate()}, ${date.getFullYear()}`;

//the main function
const main = async () => {
  clear();
  console.log(
    figlet.textSync('Open-Journal CLI', {
      horizontalLayout: 'default',
      verticalLayout: 'default',
      whitespaceBreak: true
    })
  );
  console.log('\n\n');
  console.log(
    chalk.blue(
      'Welcome to your personal journal companion interface. You can just make entries using this interface. You cannot edit or view your records.'
    )
  );
  console.log('\n');

  //promt a password from the user
  passwordChecking('Enter your password: ');
};

//function to prompt password from the user
const passwordPrompting = async (msg) => {
  console.log('\n');
  const password = await prompt.password(chalk.cyan(msg));
  //increase the number of tries that a user does for password entry
  passwordTries += 1;
  return password;
};

const passwordChecking = async (msg) => {
  const password = await passwordPrompting(msg);

  //enter the hash of your password here
  const passwordHash = "$2a$10$utoe1mEOLGLyvLuMDmZklOhoD0.6XH.nfGJJc9LANOSMG.af7c4Z2"
  //check if the password was correctly entered or not
  bcrypt.compare(password, passwordHash, async (err, res) => {
    if (res) {
    console.log('\n');
    console.log(
      chalk.bold.bold.rgb(
        100,
        255,
        100
      )('Correct password was entered, connecting to the database now.')
    );
    // if the password was correct, connect to the mongoDB database
    await connectDB();
    await fillEntry();
    }
    else {
    console.log(
      chalk.bold.bold.rgb(255, 100, 100)('Incorrect password was entered.')
    );
    //cannot try more than 3 passwords at a time
    if (passwordTries < 3) {
      passwordChecking('Re-enter your password: ');
    }
    else {
      console.log(chalk.red("\nToo many attempts. Exiting now."))
      await wait(3000)
      clear()
      process.exit(1)
    }
    }
});
};

const fillEntry = async () => {
  clear();
  console.log(
    figlet.textSync('New Record', {
      horizontalLayout: 'default',
      verticalLayout: 'default',
      whitespaceBreak: true
    })
  );
  await wait(3000);
  console.log('\n');
  //get the inputs from the user
  const body = await prompt(chalk.white('Body: '));
  console.log('\n');
  let title = await prompt(chalk.white(`Title: (${postDefaultTitle}) `));
  console.log('\n');
  let image = await prompt(chalk.white('Image URL: '));
  console.log('\n');
  //the the values were not entered, fallback to the default values
  if (!title) title = postDefaultTitle;
  if (!image) image = null;
  //create a mongoose object from the entered values
  const newRecord = new Record({
    title: title,
    imgURL: image,
    body: body
  });
  console.log(chalk.yellow('Saving your responses'));
  await wait(3000);
  clear();
  console.log(
    figlet.textSync('New Record', {
      horizontalLayout: 'default',
      verticalLayout: 'default',
      whitespaceBreak: true
    })
  );

  //display the entered values to the user
  console.log(chalk.yellow('This is your new post: \n'));
  console.log(newRecord);
  console.log('\n\n');
  //ask if the user is sure to submit the post
  const ok = await prompt.confirm(chalk.yellow('Post this entry? '));
  if (ok) {
    try {
      //saving the entry to the mongoDB database
      await newRecord.save();
      await wait(1500)
      clear()
      console.log(chalk.green('Your post was added successfully'));
      console.log(chalk.red('Exiting now'));
      await wait(2000);
      clear()
      process.exit(0)
    } catch (error) {
      console.log(chalk.red('There was an error uploading that post'));
      //ask if the user wants to try again upon failed save
      const tryAgain = await prompt.confirm(chalk.yellow('Do you want to try again? '));
      if (tryAgain) {
        fillEntry();
      } else {
        console.log(chalk.red('\nYour post was not saved, exiting now.\n'));
        await wait(2000)
        clear()
        process.exit(1);
      }
    }
  } else {
    const ok = await prompt.confirm(chalk.yellow('Do you want to try again? '));
    if (ok) {
      fillEntry();
    } else {
      console.log(chalk.red('\nYour post was not saved, exiting now.\n'));
      process.exit(1);
    }
  }
};

main();
