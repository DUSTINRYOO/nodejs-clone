import User from "../models/User";
import Video from "../models/Video";
import fetch from "cross-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });

export const postJoin = async (req, res) => {
  const { name, username, email, password, password2, location } = req.body;
  const usernameExists = await User.exists({ username });
  const pageTitle = "join";
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Password confirmation doesn't match.",
    });
  }
  if (usernameExists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This username is already taken.",
    });
  }
  const emailExists = await User.exists({ email });
  if (emailExists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This email is already taken.",
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: error._message,
    });
  }
};

export const getLogin = (req, res) =>
  res.render("login", {
    pageTitle: "Login",
  });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username, socialOnly: false });
  const pageTitle = "Login";
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "An account with this username doesn't exist",
    });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(400).render("login", {
      pageTitle,
      errorMessage: "Wrong password",
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "post",
      headers: { Accept: "application/json" },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();

    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary == true && email.verified == true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        name: userData.name ? userData.name : "Unknown",
        socialOnly: true,
        username: userData.login,
        avatarUrl: userData.avatar_url,
        email: emailObj.email,
        password: "",
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const getEdit = (req, res) => {
  return res.render("edit-profile", {
    pageTitle: "Edit Profile",
  });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl },
    },
    body: { name, username, email, location },
    file,
  } = req;
  if (req.body.username !== req.session.user.username) {
    const usernameExists = await User.exists({ username });
    if (usernameExists) {
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile",
        errorMessage: "This username is already taken.",
      });
    }
  }
  if (req.body.email !== req.session.user.email) {
    const emailExists = await User.exists({ email });
    if (emailExists) {
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile",
        errorMessage: "This email is already taken.",
      });
    }
  }
  console.log(file);
  const user = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.location : avatarUrl,
      name,
      email,
      username,
      location,
    },
    { new: true }
  );
  req.session.user = user;
  req.flash("success", "Saved");
  return res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly == true) {
    req.flash("error", "Can't change password");
    return res.redirect("/");
  }
  return res.render("change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { oldpassword, newpassword, newpassword2 },
  } = req;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldpassword, user.password);
  if (!ok) {
    return res.status(400).render("change-password", {
      pageTitle: "Change Password",
      errorMessage: "Current password is incorrect",
    });
  }
  if (newpassword !== newpassword2) {
    return res.status(400).render("change-password", {
      pageTitle: "Change Password",
      errorMessage: "Password confirmation doesn't match.",
    });
  }
  user.password = newpassword;
  await user.save();
  req.flash("info", "Password updated");
  return res.redirect("/user/logout");
};

export const logout = (req, res) => {
  req.session.user = null;
  res.locals.loggedInUser = req.session.user;
  req.session.loggedIn = false;
  req.flash("info", "Bye bye");
  return res.redirect("/");
};

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("videos");
  if (!user) {
    return res.status(404).render("404", { pageTitle: "Can't find user" });
  }
  return res.render("profile", {
    pageTitle: `${user.name}'s profile`,
    user,
  });
};
