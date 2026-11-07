from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from . import config

engine = create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def iso(dt: datetime | None) -> str | None:
    return dt.isoformat() + "Z" if dt else None


class User(Base):
    """administrator=True -> admin ; False -> superviseur (comme Traccar)."""
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(300))
    administrator: Mapped[bool] = mapped_column(Boolean, default=False)
    regions: Mapped[str] = mapped_column(String(300), default="")  # "Tunis,Bizerte"
    disabled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Device(Base):
    """Un 'device' Traccar = un local électrique."""
    __tablename__ = "devices"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    unique_id: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    region: Mapped[str] = mapped_column(String(80), default="", index=True)
    address: Mapped[str] = mapped_column(String(255), default="")
    latitude: Mapped[float] = mapped_column(Float, default=0.0)
    longitude: Mapped[float] = mapped_column(Float, default=0.0)
    camera_source: Mapped[str] = mapped_column(String(400), default="")  # "0", rtsp://..., http://.../stream
    created_by: Mapped[int | None] = mapped_column(Integer, nullable=True)
    last_update: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Event(Base):
    __tablename__ = "events"
    id: Mapped[int] = mapped_column(primary_key=True)
    device_id: Mapped[int] = mapped_column(ForeignKey("devices.id"), index=True)
    type: Mapped[str] = mapped_column(String(30))  # fire | smoke | spark
    level: Mapped[str] = mapped_column(String(20))  # suspect | alert
    confidence: Mapped[float] = mapped_column(Float, default=0.0)
    event_time: Mapped[datetime] = mapped_column(DateTime, default=utcnow, index=True)
