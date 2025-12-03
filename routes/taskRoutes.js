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
  generatePDF,
} = require("../controllers/taskController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const router = Router();

router.get("/", authMiddleware, renderList);
router.get("/history", authMiddleware, renderHistory);
router.get("/new", authMiddleware, renderNew);
router.post("/new", authMiddleware, create);
router.get("/edit/:id", authMiddleware, renderEdit);
router.post("/edit/:id", authMiddleware, edit);
router.get("/pdf/:id", authMiddleware, generatePDF);
router.post("/mark-paid/:id", authMiddleware, markAsPaid);
router.post("/delete/:id", authMiddleware, remove);

module.exports = router;
