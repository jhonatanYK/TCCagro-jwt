const { Router } = require("express");
const {
  renderList,
  renderNew,
  create,
  renderEdit,
  edit,
  markAsPaid,
  markAsUnpaid,
  remove,
  renderHistory,
} = require("../controllers/taskController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = Router();

router.get("/", authMiddleware, renderList);
router.get("/history", authMiddleware, renderHistory);
router.get("/new", authMiddleware, renderNew);
router.post("/new", authMiddleware, create);
router.get("/edit/:id", authMiddleware, renderEdit);
router.post("/edit/:id", authMiddleware, edit);
router.post("/mark-paid/:id", authMiddleware, markAsPaid);
router.post("/delete/:id", authMiddleware, remove);

module.exports = router;
